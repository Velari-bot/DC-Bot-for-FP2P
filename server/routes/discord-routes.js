/**
 * Discord Integration API Routes
 * Handles webhooks and API endpoints for Discord access management
 */

const express = require('express');
const router = express.Router();

class DiscordRoutes {
  constructor(discordBot, podiaService, userModel) {
    this.discordBot = discordBot;
    this.podiaService = podiaService;
    this.userModel = userModel;
    this.setupRoutes();
  }

  setupRoutes() {
    // Webhook endpoint for Podia subscription events
    router.post('/webhook/podia', this.handlePodiaWebhook.bind(this));

    // Manual sync endpoint (for testing/debugging)
    router.post('/sync/user/:podiaUserId', this.syncUser.bind(this));

    // Update user's power ranking
    router.post('/user/:podiaUserId/pr', this.updatePowerRanking.bind(this));

    // Link Discord account
    router.post('/user/:podiaUserId/link-discord', this.linkDiscord.bind(this));

    // Get user status
    router.get('/user/:podiaUserId/status', this.getUserStatus.bind(this));

    // Process user access manually
    router.post('/process/:podiaUserId', this.processUserAccess.bind(this));

    // Revoke access
    router.post('/revoke/:podiaUserId', this.revokeAccess.bind(this));

    // Health check
    router.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        discordReady: this.discordBot.isReady,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle Podia webhook events
   */
  async handlePodiaWebhook(req, res) {
    try {
      // Verify webhook signature
      const signature = req.headers['x-podia-signature'];
      const webhookSecret = process.env.PODIA_WEBHOOK_SECRET;
      
      if (webhookSecret && signature) {
        const isValid = this.podiaService.verifyWebhookSignature(
          req.body,
          signature,
          webhookSecret
        );
        
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const event = req.body;
      console.log('Received Podia webhook:', event.type);

      // Handle different event types
      switch (event.type) {
        case 'subscription.created':
        case 'subscription.updated':
          await this.handleSubscriptionUpdate(event.data);
          break;
        
        case 'subscription.canceled':
        case 'subscription.expired':
          await this.handleSubscriptionCancellation(event.data);
          break;
        
        case 'user.updated':
          await this.handleUserUpdate(event.data);
          break;
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling Podia webhook:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Handle subscription creation/update
   */
  async handleSubscriptionUpdate(subscriptionData) {
    try {
      const podiaUserId = subscriptionData.user_id || subscriptionData.customer?.id;
      if (!podiaUserId) {
        throw new Error('No user ID in subscription data');
      }

      // Get all active subscriptions (masterclasses + coaching)
      const activeSubscriptions = await this.podiaService.getActiveSubscriptions(podiaUserId);
      
      if (activeSubscriptions.length === 0) {
        console.log(`No active subscriptions for user ${podiaUserId}`);
        return;
      }

      // Get or create user record
      let user = await this.userModel.getUserByPodiaId(podiaUserId);
      
      // Get Discord ID from Podia or existing record
      let discordUserId = user?.discordUserId;
      if (!discordUserId) {
        discordUserId = await this.podiaService.getUserDiscordId(podiaUserId);
      }

      if (!discordUserId) {
        console.log(`No Discord account linked for user ${podiaUserId}`);
        // Store subscription data for when Discord is linked
        // Note: This needs to be updated to handle multiple subscriptions
        const masterclassSub = activeSubscriptions.find(sub => sub.productConfig?.type === 'masterclass');
        if (masterclassSub) {
          await this.userModel.upsertUser({
            podiaUserId,
            masterclassLevel: masterclassSub.productConfig?.level,
            subscriptionId: masterclassSub.subscriptionId,
            subscriptionStatus: masterclassSub.status,
            expiresAt: masterclassSub.expiresAt
          });
        }
        return;
      }

      // Process each active subscription
      const powerRanking = user?.powerRanking || 0;
      
      for (const subscription of activeSubscriptions) {
        if (!subscription.productConfig) {
          console.warn(`No product config found for subscription ${subscription.subscriptionId}`);
          continue;
        }

        // Process Discord access for this product
        await this.discordBot.processProductAccess(
          discordUserId,
          subscription.productId,
          powerRanking
        );
      }

      // Update user record with masterclass info (for backward compatibility)
      const masterclassSub = activeSubscriptions.find(sub => sub.productConfig?.type === 'masterclass');
      user = await this.userModel.upsertUser({
        podiaUserId,
        discordUserId,
        masterclassLevel: masterclassSub?.productConfig?.level || null,
        subscriptionId: masterclassSub?.subscriptionId || null,
        subscriptionStatus: masterclassSub?.status || null,
        expiresAt: masterclassSub?.expiresAt || null,
        powerRanking
      });

      console.log(`✅ Processed ${activeSubscriptions.length} subscription(s) for user ${podiaUserId}`);
    } catch (error) {
      console.error('Error handling subscription update:', error);
      throw error;
    }
  }

  /**
   * Handle subscription cancellation/expiration
   */
  async handleSubscriptionCancellation(subscriptionData) {
    try {
      const podiaUserId = subscriptionData.user_id || subscriptionData.customer?.id;
      if (!podiaUserId) {
        throw new Error('No user ID in subscription data');
      }

      const user = await this.userModel.getUserByPodiaId(podiaUserId);
      if (!user || !user.discordUserId) {
        console.log(`User ${podiaUserId} not found or has no Discord account`);
        return;
      }

      // Remove subscription from user record
      await this.userModel.removeSubscription(podiaUserId);

      // Revoke Discord access
      await this.discordBot.revokeAccess(user.discordUserId);

      console.log(`✅ Revoked access for user ${podiaUserId} (Discord: ${user.discordUserId})`);
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
      throw error;
    }
  }

  /**
   * Handle user update (e.g., Discord account linked)
   */
  async handleUserUpdate(userData) {
    try {
      const podiaUserId = userData.id;
      const discordUserId = await this.podiaService.getUserDiscordId(podiaUserId);

      if (discordUserId) {
        await this.userModel.linkDiscordAccount(podiaUserId, discordUserId);
        
        // Check if user has active subscription and process access
        const user = await this.userModel.getUserByPodiaId(podiaUserId);
        if (user?.masterclassLevel) {
          await this.processUserAccess(podiaUserId, user.masterclassLevel, user.powerRanking);
        }
      }
    } catch (error) {
      console.error('Error handling user update:', error);
      throw error;
    }
  }

  /**
   * Manual sync endpoint
   */
  async syncUser(req, res) {
    try {
      const { podiaUserId } = req.params;
      
      // Get subscription from Podia
      const subscription = await this.podiaService.getActiveMasterclassSubscription(podiaUserId);
      
      if (!subscription) {
        return res.json({ 
          message: 'No active masterclass subscription found',
          hasSubscription: false
        });
      }

      // Get Discord ID
      const discordUserId = await this.podiaService.getUserDiscordId(podiaUserId);
      
      if (!discordUserId) {
        return res.json({
          message: 'No Discord account linked',
          hasSubscription: true,
          hasDiscord: false
        });
      }

      // Get user record
      let user = await this.userModel.getUserByPodiaId(podiaUserId);
      const powerRanking = user?.powerRanking || 0;

      // Update user record
      user = await this.userModel.upsertUser({
        podiaUserId,
        discordUserId,
        masterclassLevel: subscription.level,
        subscriptionId: subscription.subscriptionId,
        subscriptionStatus: subscription.status,
        expiresAt: subscription.expiresAt,
        powerRanking
      });

      // Process access
      const result = await this.discordBot.processUserAccess(
        discordUserId,
        subscription.level,
        powerRanking
      );

      res.json({
        success: true,
        user,
        result
      });
    } catch (error) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update user's power ranking
   */
  async updatePowerRanking(req, res) {
    try {
      const { podiaUserId } = req.params;
      const { powerRanking } = req.body;

      if (!powerRanking && powerRanking !== 0) {
        return res.status(400).json({ error: 'Power ranking is required' });
      }

      const user = await this.userModel.updatePowerRanking(podiaUserId, powerRanking);
      
      // If user has active subscription, update their access
      if (user.masterclassLevel && user.discordUserId) {
        await this.discordBot.processUserAccess(
          user.discordUserId,
          user.masterclassLevel,
          user.powerRanking
        );
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('Error updating power ranking:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Link Discord account manually
   */
  async linkDiscord(req, res) {
    try {
      const { podiaUserId } = req.params;
      const { discordUserId } = req.body;

      if (!discordUserId) {
        return res.status(400).json({ error: 'Discord user ID is required' });
      }

      const user = await this.userModel.linkDiscordAccount(podiaUserId, discordUserId);
      
      // If user has active subscription, process access
      if (user.masterclassLevel) {
        await this.discordBot.processUserAccess(
          discordUserId,
          user.masterclassLevel,
          user.powerRanking
        );
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('Error linking Discord account:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user status
   */
  async getUserStatus(req, res) {
    try {
      const { podiaUserId } = req.params;
      const user = await this.userModel.getUserByPodiaId(podiaUserId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Error getting user status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Process user access (internal method)
   */
  async processUserAccess(podiaUserId, masterclassLevel, powerRanking) {
    const user = await this.userModel.getUserByPodiaId(podiaUserId);
    
    if (!user || !user.discordUserId) {
      throw new Error('User not found or Discord not linked');
    }

    return await this.discordBot.processUserAccess(
      user.discordUserId,
      masterclassLevel,
      powerRanking
    );
  }

  /**
   * Revoke access endpoint
   */
  async revokeAccess(req, res) {
    try {
      const { podiaUserId } = req.params;
      const user = await this.userModel.getUserByPodiaId(podiaUserId);
      
      if (!user || !user.discordUserId) {
        return res.status(404).json({ error: 'User not found or Discord not linked' });
      }

      await this.discordBot.revokeAccess(user.discordUserId);
      await this.userModel.removeSubscription(podiaUserId);

      res.json({ success: true, message: 'Access revoked' });
    } catch (error) {
      console.error('Error revoking access:', error);
      res.status(500).json({ error: error.message });
    }
  }

  getRouter() {
    return router;
  }
}

module.exports = DiscordRoutes;

