/**
 * Podia API Service
 * Handles communication with Podia API to fetch subscription data
 */

const axios = require('axios');
const products = require('./config/products');

class PodiaService {
  constructor(config) {
    this.config = config;
    this.baseURL = 'https://api.podia.com/v1';
    this.apiToken = config.podiaApiToken;
  }

  /**
   * Get user's subscriptions from Podia
   */
  async getUserSubscriptions(podiaUserId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/${podiaUserId}/subscriptions`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.subscriptions || [];
    } catch (error) {
      if (error.response?.status === 404) {
        return []; // User has no subscriptions
      }
      console.error('Error fetching Podia subscriptions:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all active subscriptions for a user
   */
  async getActiveSubscriptions(podiaUserId) {
    try {
      const subscriptions = await this.getUserSubscriptions(podiaUserId);
      
      // Filter for active subscriptions
      const activeSubs = subscriptions.filter(sub => {
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        return isActive;
      });

      return activeSubs.map(sub => ({
        subscriptionId: sub.id,
        productId: sub.product_id || sub.product?.id,
        status: sub.status,
        expiresAt: sub.expires_at || sub.current_period_end,
        canceledAt: sub.canceled_at,
        productConfig: products.getProductByPodiaId(sub.product_id || sub.product?.id)
      }));
    } catch (error) {
      console.error('Error getting active subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get active masterclass subscription for a user
   * Returns the highest level masterclass subscription
   */
  async getActiveMasterclassSubscription(podiaUserId) {
    try {
      const subscriptions = await this.getUserSubscriptions(podiaUserId);
      
      // Filter for active masterclass subscriptions
      const masterclassSubs = subscriptions.filter(sub => {
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        const isMasterclass = this.isMasterclassProduct(sub.product_id || sub.product?.id);
        return isActive && isMasterclass;
      });

      if (masterclassSubs.length === 0) {
        return null;
      }

      // Return the highest level masterclass
      // Order: Advanced > Intermediate > Beginner
      const levels = { 'advanced': 3, 'intermediate': 2, 'beginner': 1 };
      
      masterclassSubs.sort((a, b) => {
        const aLevel = this.getMasterclassLevel(a.product_id || a.product?.id);
        const bLevel = this.getMasterclassLevel(b.product_id || b.product?.id);
        return (levels[bLevel] || 0) - (levels[aLevel] || 0);
      });

      const highestSub = masterclassSubs[0];
      return {
        subscriptionId: highestSub.id,
        productId: highestSub.product_id || highestSub.product?.id,
        level: this.getMasterclassLevel(highestSub.product_id || highestSub.product?.id),
        status: highestSub.status,
        expiresAt: highestSub.expires_at || highestSub.current_period_end,
        canceledAt: highestSub.canceled_at
      };
    } catch (error) {
      console.error('Error getting active masterclass subscription:', error);
      throw error;
    }
  }

  /**
   * Check if a product ID is a masterclass product
   */
  isMasterclassProduct(productId) {
    // You'll need to configure your Podia product IDs
    const masterclassProducts = {
      beginner: process.env.PODIA_BEGINNER_PRODUCT_ID || '',
      intermediate: process.env.PODIA_INTERMEDIATE_PRODUCT_ID || '',
      advanced: process.env.PODIA_ADVANCED_PRODUCT_ID || ''
    };

    return Object.values(masterclassProducts).includes(String(productId));
  }

  /**
   * Get masterclass level from product ID
   */
  getMasterclassLevel(productId) {
    const productIdStr = String(productId);
    
    if (productIdStr === process.env.PODIA_ADVANCED_PRODUCT_ID) return 'advanced';
    if (productIdStr === process.env.PODIA_INTERMEDIATE_PRODUCT_ID) return 'intermediate';
    if (productIdStr === process.env.PODIA_BEGINNER_PRODUCT_ID) return 'beginner';
    
    return null;
  }

  /**
   * Get user information from Podia
   */
  async getUserInfo(podiaUserId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/${podiaUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.user || response.data;
    } catch (error) {
      console.error('Error fetching Podia user info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user's connected Discord account from Podia
   * This assumes Podia stores Discord connection in custom fields or integrations
   */
  async getUserDiscordId(podiaUserId) {
    try {
      const userInfo = await this.getUserInfo(podiaUserId);
      
      // Podia custom fields structure - adjust based on your Podia setup
      const discordId = userInfo.custom_fields?.discord_id || 
                       userInfo.integrations?.discord?.user_id ||
                       userInfo.metadata?.discord_id;
      
      return discordId || null;
    } catch (error) {
      console.error('Error getting Discord ID from Podia:', error);
      return null;
    }
  }

  /**
   * Verify webhook signature from Podia
   */
  verifyWebhookSignature(payload, signature, secret) {
    // Implement webhook signature verification
    // This is important for security
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = PodiaService;

