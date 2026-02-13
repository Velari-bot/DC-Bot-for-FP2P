/**
 * Product Configuration
 * Maps Podia product IDs to Discord roles and access levels
 */

module.exports = {
  // Masterclass Products
  MASTERCLASS: {
    BEGINNER: {
      productId: process.env.PODIA_BEGINNER_PRODUCT_ID || '',
      discordRoleId: '1444829030263165109',
      type: 'masterclass',
      level: 'beginner'
    },
    INTERMEDIATE: {
      productId: process.env.PODIA_INTERMEDIATE_PRODUCT_ID || '',
      discordRoleId: '1444829519964930088',
      type: 'masterclass',
      level: 'intermediate'
    },
    ADVANCED: {
      productId: process.env.PODIA_ADVANCED_PRODUCT_ID || '',
      discordRoleId: '1444829551984378027',
      type: 'masterclass',
      level: 'advanced'
    }
  },

  // Coaching Products
  COACHING: {
    VOD_REVIEW: {
      productId: process.env.PODIA_VOD_REVIEW_PRODUCT_ID || '',
      discordRoleId: '1456799809666154584',
      type: 'coaching',
      name: 'Deckzee VOD Review Membership',
      channelId: process.env.DISCORD_VOD_REVIEW_CHANNEL_ID || ''
    },
    ONE_ON_ONE: {
      productId: process.env.PODIA_ONE_ON_ONE_PRODUCT_ID || '',
      discordRoleId: '1456799859108479190',
      type: 'coaching',
      name: '1-on-1 Coaching',
      channelId: process.env.DISCORD_ONE_ON_ONE_CHANNEL_ID || ''
    },
    SEASONAL_BASIC: {
      productId: process.env.PODIA_SEASONAL_BASIC_PRODUCT_ID || '',
      discordRoleId: '1456799883519594680',
      type: 'coaching',
      name: 'Seasonal Coaching (2 Months)',
      channelId: process.env.DISCORD_SEASONAL_BASIC_CHANNEL_ID || ''
    },
    SEASONAL_ADVANCED: {
      productId: process.env.PODIA_SEASONAL_ADVANCED_PRODUCT_ID || '',
      discordRoleId: '1456799919238025358',
      type: 'coaching',
      name: 'Advanced Seasonal Coaching',
      channelId: process.env.DISCORD_SEASONAL_ADVANCED_CHANNEL_ID || ''
    }
  },

  /**
   * Get product configuration by Podia product ID
   */
  getProductByPodiaId(podiaProductId) {
    const allProducts = [
      ...Object.values(this.MASTERCLASS),
      ...Object.values(this.COACHING)
    ];

    return allProducts.find(product => product.productId === String(podiaProductId));
  },

  /**
   * Get product configuration by Discord role ID
   */
  getProductByRoleId(roleId) {
    const allProducts = [
      ...Object.values(this.MASTERCLASS),
      ...Object.values(this.COACHING)
    ];

    return allProducts.find(product => product.discordRoleId === String(roleId));
  },

  /**
   * Get all masterclass products
   */
  getMasterclassProducts() {
    return Object.values(this.MASTERCLASS);
  },

  /**
   * Get all coaching products
   */
  getCoachingProducts() {
    return Object.values(this.COACHING);
  },

  /**
   * Check if product is a masterclass
   */
  isMasterclass(productId) {
    const product = this.getProductByPodiaId(productId);
    return product?.type === 'masterclass';
  },

  /**
   * Check if product is coaching
   */
  isCoaching(productId) {
    const product = this.getProductByPodiaId(productId);
    return product?.type === 'coaching';
  }
};

