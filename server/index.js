/**
 * Discord Integration Server
 * Main server file for Discord ↔ Podia Masterclass Access System
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const DiscordBotService = require('./discord-bot');
const PodiaService = require('./podia-service');
const UserModel = require('./models/user');
const DiscordRoutes = require('./routes/discord-routes');

class DiscordIntegrationServer {
  constructor() {
    this.app = express();
    this.discordBot = null;
    this.podiaService = null;
    this.userModel = null;
    this.routes = null;
    this.cronJobs = [];
  }

  /**
   * Initialize services
   */
  async initialize() {
    try {
      // Validate required environment variables
      this.validateEnvironment();

      // Initialize Podia service
      this.podiaService = new PodiaService({
        podiaApiToken: process.env.PODIA_API_TOKEN
      });

      // Initialize user model (use database connection if available)
      this.userModel = new UserModel(/* database connection */);

      // Initialize Discord bot
      this.discordBot = new DiscordBotService({
        discordToken: process.env.DISCORD_BOT_TOKEN,
        discordGuildId: process.env.DISCORD_GUILD_ID
      });

      // Start Discord bot
      await this.discordBot.start();

      // Initialize routes
      this.routes = new DiscordRoutes(
        this.discordBot,
        this.podiaService,
        this.userModel
      );

      // Setup Express middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup cron jobs
      this.setupCronJobs();

      console.log('✅ All services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize server:', error);
      throw error;
    }
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    const required = [
      'DISCORD_BOT_TOKEN',
      'DISCORD_GUILD_ID',
      'PODIA_API_TOKEN'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // API routes
    this.app.use('/api/discord', this.routes.getRouter());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        discordReady: this.discordBot?.isReady || false,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup cron jobs for periodic tasks
   */
  setupCronJobs() {
    // Check for expired subscriptions every hour
    const checkExpiredSubscriptions = async () => {
      try {
        console.log('Checking for expired subscriptions...');
        
        const expiredUsers = await this.userModel.getExpiredSubscriptions();
        
        for (const user of expiredUsers) {
          if (user.discordUserId) {
            console.log(`Revoking access for expired user: ${user.podiaUserId}`);
            await this.discordBot.revokeAccess(user.discordUserId);
            await this.userModel.removeSubscription(user.podiaUserId);
          }
        }

        if (expiredUsers.length > 0) {
          console.log(`Processed ${expiredUsers.length} expired subscriptions`);
        }
      } catch (error) {
        console.error('Error checking expired subscriptions:', error);
      }
    };

    // Run immediately on startup (after a delay)
    setTimeout(checkExpiredSubscriptions, 60000); // 1 minute delay

    // Run every hour
    const interval = setInterval(checkExpiredSubscriptions, 60 * 60 * 1000);
    this.cronJobs.push(interval);
  }

  /**
   * Start the server
   */
  async start(port = process.env.PORT || 3001) {
    try {
      await this.initialize();

      this.app.listen(port, () => {
        console.log(`🚀 Discord Integration Server running on port ${port}`);
        console.log(`📡 API endpoints available at http://localhost:${port}/api/discord`);
        console.log(`💚 Health check: http://localhost:${port}/health`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down server...');
    
    // Stop cron jobs
    this.cronJobs.forEach(interval => clearInterval(interval));
    
    // Stop Discord bot
    if (this.discordBot) {
      await this.discordBot.stop();
    }

    process.exit(0);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new DiscordIntegrationServer();
  server.start();

  // Handle graceful shutdown
  process.on('SIGTERM', () => server.shutdown());
  process.on('SIGINT', () => server.shutdown());
}

module.exports = DiscordIntegrationServer;

