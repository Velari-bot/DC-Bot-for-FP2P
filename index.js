const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// Increase body limit for larger audio files
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Mount transcribe-video API routes
// Mount transcribe-video API routes
const transcribeVideoRouter = require('./api/transcribe-video');
app.use('/api/transcribe-video', transcribeVideoRouter);

// Admin API
app.use('/api/admin', require('./api/admin'));

// Tracking API
app.use('/api/track', require('./api/track'));

// Discord Auth API
app.use('/api/discord-auth', require('./api/discord-auth'));

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1465794024412545387/cRODOUOUsHnGaJhJ2prPoqOKI4C1QQ6n7IB8xmDt5ZIyf40EkCBSTK9NhfD3eDuVFBjc";

app.post('/api/purchase-intent', async (req, res) => {
  const { name, id, product } = req.body;

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

const PORT = 3000;

// Serve static files with no caching to ensure live updates
const staticOptions = {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
  }
};

app.use(express.static(path.join(__dirname, 'dist'), staticOptions));
app.use(express.static(path.join(__dirname, 'public'), staticOptions));

// Serve index.html for any unmatched route
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});