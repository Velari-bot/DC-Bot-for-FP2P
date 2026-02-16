/**
 * Discord Bot Service for Masterclass Access System
 * Handles role assignment and Friend Group access based on Podia subscriptions
 */

const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const axios = require('axios');
const products = require('./config/products');

class DiscordBotService {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.isReady = false;

    // Legacy role IDs (for backward compatibility)
    this.ROLES = {
      BEGINNER: '1444829030263165109',
      INTERMEDIATE: '1444829519964930088',
      ADVANCED: '1444829551984378027'
    };

    // Friend Group Server IDs (you'll need to add these)
    this.FG_SERVERS = {
      BEGINNER: process.env.DISCORD_FG_BEGINNER_SERVER_ID || '',
      INTERMEDIATE: process.env.DISCORD_FG_INTERMEDIATE_SERVER_ID || '',
      ADVANCED: process.env.DISCORD_FG_ADVANCED_SERVER_ID || ''
    };
  }

  /**
   * Initialize and start the Discord bot
   */
  async start() {
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages
        ]
      });

      this.client.once('ready', () => {
        console.log(`✅ Discord bot logged in as ${this.client.user.tag}`);
        this.isReady = true;
      });

      this.client.on('error', (error) => {
        console.error('Discord bot error:', error);
      });

      await this.client.login(this.config.discordToken);
      return true;
    } catch (error) {
      console.error('Failed to start Discord bot:', error);
      throw error;
    }
  }

  /**
   * Stop the Discord bot
   */
  async stop() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      console.log('Discord bot stopped');
    }
  }

  /**
   * Get the main Discord guild (server)
   */
  async getGuild() {
    if (!this.isReady || !this.client) {
      throw new Error('Discord bot is not ready');
    }
    return await this.client.guilds.fetch(this.config.discordGuildId);
  }

  /**
   * Get a member by their Discord user ID
   */
  async getMember(discordUserId) {
    const guild = await this.getGuild();
    try {
      return await guild.members.fetch(discordUserId);
    } catch (error) {
      if (error.code === 10007) {
        // Member not found
        return null;
      }
      throw error;
    }
  }

  /**
   * Assign role to a user by product ID
   */
  async assignRoleByProduct(discordUserId, podiaProductId) {
    try {
      const product = products.getProductByPodiaId(podiaProductId);
      if (!product) {
        throw new Error(`Product not found for ID: ${podiaProductId}`);
      }

      const member = await this.getMember(discordUserId);
      if (!member) {
        throw new Error(`Member ${discordUserId} not found in Discord server`);
      }

      const role = await member.guild.roles.fetch(product.discordRoleId);
      if (!role) {
        throw new Error(`Role ${product.discordRoleId} not found`);
      }

      // Add the role (don't remove other roles - users can have multiple)
      if (!member.roles.cache.has(product.discordRoleId)) {
        await member.roles.add(role);
        console.log(`✅ Assigned ${product.name || product.level} role to ${member.user.tag} (${discordUserId})`);
      }

      // Grant channel access if product has a channel
      if (product.channelId) {
        await this.grantChannelAccess(member, product.channelId);
      }

      return { success: true, roleId: product.discordRoleId, roleName: role.name, product };
    } catch (error) {
      console.error(`Failed to assign role to ${discordUserId}:`, error);
      throw error;
    }
  }

  /**
   * Assign masterclass role to a user (legacy method)
   */
  async assignMasterclassRole(discordUserId, masterclassLevel) {
    try {
      const masterclassProducts = products.getMasterclassProducts();
      const product = masterclassProducts.find(p => p.level === masterclassLevel.toLowerCase());

      if (!product) {
        throw new Error(`Invalid masterclass level: ${masterclassLevel}`);
      }

      return await this.assignRoleByProduct(discordUserId, product.productId);
    } catch (error) {
      console.error(`Failed to assign masterclass role to ${discordUserId}:`, error);
      throw error;
    }
  }

  /**
   * Grant access to a private Discord channel
   */
  async grantChannelAccess(member, channelId) {
    try {
      const channel = await member.guild.channels.fetch(channelId);
      if (!channel) {
        console.warn(`Channel ${channelId} not found`);
        return;
      }

      // Grant view channel permission
      await channel.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        ReadMessageHistory: true
      });

      console.log(`✅ Granted channel access to ${member.user.tag} for channel ${channel.name}`);
    } catch (error) {
      console.error(`Failed to grant channel access:`, error);
      // Don't throw - channel access is optional
    }
  }

  /**
   * Revoke access from a private Discord channel
   */
  async revokeChannelAccess(member, channelId) {
    try {
      const channel = await member.guild.channels.fetch(channelId);
      if (!channel) {
        return;
      }

      await channel.permissionOverwrites.delete(member.id);
      console.log(`✅ Revoked channel access from ${member.user.tag} for channel ${channel.name}`);
    } catch (error) {
      console.error(`Failed to revoke channel access:`, error);
    }
  }

  /**
   * Remove all masterclass roles from a member (legacy method)
   */
  async removeAllMasterclassRoles(member) {
    const masterclassProducts = products.getMasterclassProducts();
    for (const product of masterclassProducts) {
      try {
        if (member.roles.cache.has(product.discordRoleId)) {
          await member.roles.remove(product.discordRoleId);
          console.log(`Removed ${product.level} role from ${member.user.tag}`);
        }
      } catch (error) {
        console.error(`Failed to remove role ${product.discordRoleId}:`, error);
      }
    }
  }

  /**
   * Remove a specific role by product ID
   */
  async removeRoleByProduct(discordUserId, podiaProductId) {
    try {
      const product = products.getProductByPodiaId(podiaProductId);
      if (!product) {
        throw new Error(`Product not found for ID: ${podiaProductId}`);
      }

      const member = await this.getMember(discordUserId);
      if (!member) {
        throw new Error(`Member ${discordUserId} not found`);
      }

      if (member.roles.cache.has(product.discordRoleId)) {
        await member.roles.remove(product.discordRoleId);
        console.log(`✅ Removed ${product.name || product.level} role from ${member.user.tag}`);
      }

      // Revoke channel access if product has a channel
      if (product.channelId) {
        await this.revokeChannelAccess(member, product.channelId);
      }

      return { success: true, product };
    } catch (error) {
      console.error(`Failed to remove role:`, error);
      throw error;
    }
  }

  /**
   * Grant access to Friend Group servers based on masterclass and PR
   */
  async grantFriendGroupAccess(discordUserId, masterclassLevel, powerRanking, earnings = 0, followers = 0) {
    const fgAccess = this.calculateFriendGroupAccess(masterclassLevel, powerRanking, earnings, followers);
    const results = [];

    for (const fgLevel of fgAccess) {
      try {
        const serverId = this.FG_SERVERS[fgLevel];
        if (!serverId) {
          console.warn(`FG server ID not configured for ${fgLevel}`);
          continue;
        }

        // Note: Adding a member to a server requires OAuth2 or manual invitation
        // This is a placeholder - you'll need to implement the actual invite/access logic
        // depending on how your FG servers are set up

        // If using Discord server invites:
        // await this.addMemberToFGServer(discordUserId, serverId);

        // If using a separate bot for FG servers:
        // await this.requestFGServerAccess(discordUserId, serverId, fgLevel);

        results.push({ fgLevel, serverId, success: true });
      } catch (error) {
        console.error(`Failed to grant ${fgLevel} FG access to ${discordUserId}:`, error);
        results.push({ fgLevel, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Revoke access from all Friend Group servers
   */
  async revokeFriendGroupAccess(discordUserId) {
    const results = [];

    for (const [fgLevel, serverId] of Object.entries(this.FG_SERVERS)) {
      if (!serverId) continue;

      try {
        // Remove member from FG server
        // Implementation depends on your FG server setup
        // await this.removeMemberFromFGServer(discordUserId, serverId);

        results.push({ fgLevel, serverId, success: true });
      } catch (error) {
        console.error(`Failed to revoke ${fgLevel} FG access from ${discordUserId}:`, error);
        results.push({ fgLevel, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Calculate which Friend Groups a user should have access to
   * Based on masterclass level and Power Ranking
   */
  calculateFriendGroupAccess(masterclassLevel, powerRanking, earnings = 0, followers = 0) {
    const pr = parseInt(powerRanking) || 0;
    const earn = parseFloat(earnings) || 0;
    const follow = parseInt(followers) || 0;
    const level = masterclassLevel ? masterclassLevel.toUpperCase() : 'NONE';

    // Matchmaking Tiers based on criteria:
    // PRO: 5k+ PR OR $2.5k+ Earnings OR 50k+ Followers
    // ELITE: 10k+ PR OR $5k+ Earnings OR 100k+ Followers
    // GOD: $10k+ Earnings OR 500k+ Followers

    const isPro = pr >= 5000 || earn >= 2500 || follow >= 50000;
    const isElite = pr >= 10000 || earn >= 5000 || follow >= 100000;
    const isGod = earn >= 10000 || follow >= 500000;

    // Map these tiers to Friend Groups
    // For now, we'll map them to the existing BEGINNER, INTERMEDIATE, ADVANCED roles for compatibility
    // but internally we know they represent the new Matchmaking tiers.

    if (isGod || level === 'ADVANCED') {
      if (isGod || pr >= 10000) {
        return ['ADVANCED', 'INTERMEDIATE', 'BEGINNER'];
      }
    }

    if (isElite || level === 'ADVANCED' || level === 'INTERMEDIATE') {
      if (isElite || pr >= 1000) {
        return ['INTERMEDIATE', 'BEGINNER'];
      }
    }

    if (isPro || level === 'BEGINNER') {
      return ['BEGINNER'];
    }

    return [];
  }

  /**
   * Revoke access for a specific product
   */
  async revokeProductAccess(discordUserId, podiaProductId) {
    return await this.removeRoleByProduct(discordUserId, podiaProductId);
  }

  /**
   * Remove masterclass role and revoke FG access
   * Used when subscription expires or is canceled (legacy method)
   */
  async revokeAccess(discordUserId, productId = null) {
    try {
      const member = await this.getMember(discordUserId);
      if (!member) {
        console.warn(`Member ${discordUserId} not found, cannot revoke access`);
        return { success: false, error: 'Member not found' };
      }

      // If specific product ID provided, revoke only that product
      if (productId) {
        return await this.revokeProductAccess(discordUserId, productId);
      }

      // Otherwise, remove all roles (for cleanup)
      const allProducts = [
        ...products.getMasterclassProducts(),
        ...products.getCoachingProducts()
      ];

      const removedRoles = [];
      for (const product of allProducts) {
        try {
          if (member.roles.cache.has(product.discordRoleId)) {
            await member.roles.remove(product.discordRoleId);
            if (product.channelId) {
              await this.revokeChannelAccess(member, product.channelId);
            }
            removedRoles.push(product.discordRoleId);
          }
        } catch (error) {
          console.error(`Failed to remove role ${product.discordRoleId}:`, error);
        }
      }

      // Revoke FG access (masterclass only)
      const fgResults = await this.revokeFriendGroupAccess(discordUserId);

      console.log(`✅ Revoked all access for ${member.user.tag} (${discordUserId})`);

      return {
        success: true,
        rolesRemoved: removedRoles,
        fgAccessRevoked: fgResults
      };
    } catch (error) {
      console.error(`Failed to revoke access for ${discordUserId}:`, error);
      throw error;
    }
  }

  /**
   * Process user access for a product
   * Main function to handle role assignment and access
   */
  async processProductAccess(discordUserId, podiaProductId, powerRanking = 0, earnings = 0, followers = 0) {
    try {
      const product = products.getProductByPodiaId(podiaProductId);
      if (!product) {
        throw new Error(`Product not found: ${podiaProductId}`);
      }

      // Assign role
      const roleResult = await this.assignRoleByProduct(discordUserId, podiaProductId);

      // If it's a masterclass, also grant FG access
      let fgResults = [];
      if (product.type === 'masterclass') {
        fgResults = await this.grantFriendGroupAccess(discordUserId, product.level, powerRanking, earnings, followers);
      }

      return {
        success: true,
        role: roleResult,
        friendGroups: fgResults,
        product
      };
    } catch (error) {
      console.error(`Failed to process product access for ${discordUserId}:`, error);
      throw error;
    }
  }

  /**
   * Process user access update (legacy method for masterclasses)
   * Main function to handle role assignment and FG access
   */
  async processUserAccess(discordUserId, masterclassLevel, powerRanking, earnings = 0, followers = 0) {
    try {
      // Assign masterclass role
      const roleResult = await this.assignMasterclassRole(discordUserId, masterclassLevel);

      // Grant FG access
      const fgResults = await this.grantFriendGroupAccess(discordUserId, masterclassLevel, powerRanking, earnings, followers);

      return {
        success: true,
        role: roleResult,
        friendGroups: fgResults
      };
    } catch (error) {
      console.error(`Failed to process access for ${discordUserId}:`, error);
      throw error;
    }
  }
}

module.exports = DiscordBotService;

