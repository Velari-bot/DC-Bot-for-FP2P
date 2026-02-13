const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

const env = dotenv.config().parsed || {};

const envKeys = Object.entries(env).reduce((acc, [key, value]) => {
  acc[`process.env.${key}`] = JSON.stringify(value);
  return acc;
}, {});

const Stripe = require('stripe');
const axios = require('axios');
const bodyParser = require('body-parser');

// Initialize Stripe with the key from environment
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const products = {
  "single_coaching": {
    name: "1:1 1 Hour Coaching Session",
    unit_amount: 15000,
    images: ["http://fortnitepathtopro.com/pfps/deckzee.png"]
  },
  "coaching_bundle_3h": {
    name: "1:1 3 Hour Coaching Bundle",
    unit_amount: 40000,
    images: ["http://fortnitepathtopro.com/pfps/deckzee.png"]
  },
  "group_coaching": {
    name: "Group Coaching Session",
    unit_amount: 3000,
    images: ["http://fortnitepathtopro.com/pfps/deckzee.png"]
  },
  "basic_season": {
    name: "Basic Seasonal Coaching",
    priceId: "price_1SuIBpENRiU5OaK0n81PgFoJ",
    images: ["http://fortnitepathtopro.com/pfps/deckzee.png"]
  },
  "advanced_season": {
    name: "Advanced Seasonal Coaching",
    priceId: "price_1SuICeENRiU5OaK0MEvPAwZy",
    images: ["http://fortnitepathtopro.com/pfps/deckzee.png"]
  },
  "vod_review": {
    name: "Deckzee VOD Reviews",
    unit_amount: 2000,
    images: ["http://fortnitepathtopro.com/pfps/deckzee.png"],
    mode: "subscription"
  }
};

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1465807681578074414/e3D7Zth20LPKFCpgBgJGURznU0UYErl-NrSrE-XDswNO1if_by5a57BpmABqww6PBJs8";

module.exports = {
  entry: './static/js/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
    publicPath: '/',
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
    new webpack.DefinePlugin(envKeys),
  ],
  devServer: {
    static: [
      path.resolve(__dirname, 'dist'),
      path.resolve(__dirname, 'public'),
    ],
    port: 3000,
    historyApiFallback: true,
    hot: true,
    liveReload: true,
    allowedHosts: 'all',
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
      // "Cross-Origin-Embedder-Policy": "credentialless",
      // "Cross-Origin-Opener-Policy": "same-origin"
    },
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.app.use(bodyParser.json());

      // API: Purchase Intent
      devServer.app.post('/api/purchase-intent', async (req, res) => {
        const { name, id, product } = req.body;
        console.log("Purchase Intent Received:", name, id, product);

        if (!name || !id) {
          return res.status(400).json({ error: "Missing name or id" });
        }

        try {
          await axios.post(DISCORD_WEBHOOK_URL, {
            content: `**New Purchase Intent**\n**User:** ${name}\n**ID:** \`${id}\`\n**Product:** ${product || "Unknown"}\n**Date:** ${new Date().toLocaleString()}`
          });
          res.json({ success: true });
        } catch (error) {
          console.error("Discord Webhook Error", error.message);
          res.status(500).json({ error: "Failed to notify" });
        }
      });

      // API: Claim Credits (Proxied Mock or Real)
      devServer.app.post('/api/claim-credits', async (req, res) => {
        // Since setting up full Firebase Admin in webpack config is complex (creds),
        // we will just acknowledge the request or try to import the handler if env is set.
        try {
          // Try to use the same logic as backend if possible, or mock success
          // In dev, we can just say "Synced" to avoid breaking the UI flow.
          console.log("Mocking Claim Credits in Dev Server");
          return res.json({ success: true, claimed: 0, message: "Dev: Synced" });
        } catch (e) {
          console.error(e);
          res.status(500).json({ message: "Dev Error" });
        }
      });

      // API: Stripe Checkout & Webhook
      devServer.app.post('/api/stripe', require('./api/stripe'));

      // CDN Proxy route removed (moved to R2)

      // API: Direct R2 Upload URL Generation
      devServer.app.post('/api/upload-url', require('./api/upload-url'));

      // API: Video Compression
      devServer.app.post('/api/compress-video', require('./api/compress-video'));

      // API: Captions (Explicit Methods)
      const captionsHandler = require('./api/captions');
      devServer.app.get('/api/captions', captionsHandler);
      devServer.app.post('/api/captions', captionsHandler);

      // API: Admin
      const adminHandler = require('./api/admin');
      devServer.app.get('/api/admin', adminHandler);
      devServer.app.post('/api/admin', adminHandler);

      // API: Tracking
      devServer.app.post('/api/track', require('./api/track'));

      // API: Discord Auth
      devServer.app.use('/api/discord-auth', require('./api/discord-auth'));

      return middlewares;
    },
    watchFiles: {
      paths: ['static/**/*', 'public/**/*'],
      options: {
        usePolling: true,
        interval: 500,
        ignored: /node_modules/,
      },
    },
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
};

