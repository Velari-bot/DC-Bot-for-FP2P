/**
 * User Model
 * Stores associations between Podia users, Discord users, and their access status
 */

// In-memory store (replace with actual database in production)
// Recommended: Use PostgreSQL, MongoDB, or similar
class UserModel {
  constructor(db = null) {
    // For production, use actual database connection
    this.db = db;
    this.users = new Map(); // Temporary in-memory storage
  }

  /**
   * Create or update user record
   */
  async upsertUser(userData) {
    const {
      podiaUserId,
      discordUserId,
      email,
      powerRanking = 0,
      earnings = 0,
      followers = 0,
      masterclassLevel = null,
      subscriptionId = null,
      subscriptionStatus = null,
      expiresAt = null
    } = userData;

    const user = {
      podiaUserId,
      discordUserId,
      email,
      powerRanking: parseInt(powerRanking) || 0,
      earnings: parseFloat(earnings) || 0,
      followers: parseInt(followers) || 0,
      masterclassLevel,
      subscriptionId,
      subscriptionStatus,
      expiresAt,
      updatedAt: new Date(),
      createdAt: this.users.has(podiaUserId)
        ? this.users.get(podiaUserId).createdAt
        : new Date()
    };

    this.users.set(podiaUserId, user);

    // In production, save to database:
    // if (this.db) {
    //   await this.db.collection('users').updateOne(
    //     { podiaUserId },
    //     { $set: user },
    //     { upsert: true }
    //   );
    // }

    return user;
  }

  /**
   * Get user by Podia user ID
   */
  async getUserByPodiaId(podiaUserId) {
    const user = this.users.get(podiaUserId);

    // In production, query database:
    // if (this.db) {
    //   return await this.db.collection('users').findOne({ podiaUserId });
    // }

    return user || null;
  }

  /**
   * Get user by Discord user ID
   */
  async getUserByDiscordId(discordUserId) {
    for (const user of this.users.values()) {
      if (user.discordUserId === discordUserId) {
        return user;
      }
    }

    // In production, query database:
    // if (this.db) {
    //   return await this.db.collection('users').findOne({ discordUserId });
    // }

    return null;
  }

  /**
   * Update user's power ranking
   */
  async updatePowerRanking(podiaUserId, powerRanking) {
    const user = await this.getUserByPodiaId(podiaUserId);
    if (!user) {
      throw new Error('User not found');
    }

    user.powerRanking = parseInt(powerRanking) || 0;
    user.updatedAt = new Date();

    this.users.set(podiaUserId, user);

    // In production, update database:
    // if (this.db) {
    //   await this.db.collection('users').updateOne(
    //     { podiaUserId },
    //     { $set: { powerRanking: user.powerRanking, updatedAt: user.updatedAt } }
    //   );
    // }

    return user;
  }

  /**
   * Update subscription status
   */
  async updateSubscription(podiaUserId, subscriptionData) {
    const user = await this.getUserByPodiaId(podiaUserId);
    if (!user) {
      throw new Error('User not found');
    }

    user.masterclassLevel = subscriptionData.level || null;
    user.subscriptionId = subscriptionData.subscriptionId || null;
    user.subscriptionStatus = subscriptionData.status || null;
    user.expiresAt = subscriptionData.expiresAt || null;
    user.updatedAt = new Date();

    this.users.set(podiaUserId, user);

    // In production, update database:
    // if (this.db) {
    //   await this.db.collection('users').updateOne(
    //     { podiaUserId },
    //     { $set: {
    //       masterclassLevel: user.masterclassLevel,
    //       subscriptionId: user.subscriptionId,
    //       subscriptionStatus: user.subscriptionStatus,
    //       expiresAt: user.expiresAt,
    //       updatedAt: user.updatedAt
    //     }}
    //   );
    // }

    return user;
  }

  /**
   * Remove subscription (on cancellation/expiration)
   */
  async removeSubscription(podiaUserId) {
    const user = await this.getUserByPodiaId(podiaUserId);
    if (!user) {
      return null;
    }

    user.masterclassLevel = null;
    user.subscriptionId = null;
    user.subscriptionStatus = null;
    user.expiresAt = null;
    user.updatedAt = new Date();

    this.users.set(podiaUserId, user);

    // In production, update database:
    // if (this.db) {
    //   await this.db.collection('users').updateOne(
    //     { podiaUserId },
    //     { $set: {
    //       masterclassLevel: null,
    //       subscriptionId: null,
    //       subscriptionStatus: null,
    //       expiresAt: null,
    //       updatedAt: new Date()
    //     }}
    //   );
    // }

    return user;
  }

  /**
   * Get all users with expired subscriptions
   * Useful for cleanup cron jobs
   */
  async getExpiredSubscriptions() {
    const now = new Date();
    const expired = [];

    for (const user of this.users.values()) {
      if (user.expiresAt && new Date(user.expiresAt) < now && user.subscriptionStatus === 'active') {
        expired.push(user);
      }
    }

    // In production, query database:
    // if (this.db) {
    //   return await this.db.collection('users').find({
    //     expiresAt: { $lt: now },
    //     subscriptionStatus: 'active'
    //   }).toArray();
    // }

    return expired;
  }

  /**
   * Link Discord account to Podia user
   */
  async linkDiscordAccount(podiaUserId, discordUserId) {
    const user = await this.getUserByPodiaId(podiaUserId);
    if (!user) {
      throw new Error('User not found');
    }

    user.discordUserId = discordUserId;
    user.updatedAt = new Date();

    this.users.set(podiaUserId, user);

    // In production, update database:
    // if (this.db) {
    //   await this.db.collection('users').updateOne(
    //     { podiaUserId },
    //     { $set: { discordUserId, updatedAt: new Date() } }
    //   );
    // }

    return user;
  }

  /**
   * Update user's skill metrics (PR, earnings, followers)
   */
  async updateSkillMetrics(podiaUserId, metrics) {
    const user = await this.getUserByPodiaId(podiaUserId);
    if (!user) {
      throw new Error('User not found');
    }

    if (metrics.powerRanking !== undefined) user.powerRanking = parseInt(metrics.powerRanking) || 0;
    if (metrics.earnings !== undefined) user.earnings = parseFloat(metrics.earnings) || 0;
    if (metrics.followers !== undefined) user.followers = parseInt(metrics.followers) || 0;

    user.updatedAt = new Date();

    this.users.set(podiaUserId, user);

    // In production, update database:
    // if (this.db) {
    //   await this.db.collection('users').updateOne(
    //     { podiaUserId },
    //     { $set: { 
    //         powerRanking: user.powerRanking, 
    //         earnings: user.earnings, 
    //         followers: user.followers,
    //         updatedAt: user.updatedAt 
    //     }}
    //   );
    // }

    return user;
  }
}

module.exports = UserModel;

