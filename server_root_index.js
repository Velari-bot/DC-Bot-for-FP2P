const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// Remove global json middleware to avoid breaking proxy streams
// app.use(express.json());

// Apply security headers for FFmpeg/Isolation
// Apply security headers for FFmpeg/Isolation
// app.use((req, res, next) => {
//   res.set('Cross-Origin-Embedder-Policy', 'credentialless');
//   res.set('Cross-Origin-Opener-Policy', 'same-origin');
//   next();
// });

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1465794024412545387/cRODOUOUsHnGaJhJ2prPoqOKI4C1QQ6n7IB8xmDt5ZIyf40EkCBSTK9NhfD3eDuVFBjc";

app.post('/api/purchase-intent', express.json(), async (req, res) => {
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

// Proxy all other API requests to the backend server
app.use('/api', async (req, res) => {
  try {
    const url = `http://localhost:4000${req.originalUrl}`;
    // Verify if backend endpoint exists or just forward blindly
    // Using axios to stream request body (important for Stripe webhooks)

    // Filter out headers that might cause issues (like host)
    const headers = { ...req.headers };
    delete headers.host;

    const response = await axios({
      method: req.method,
      url: url,
      headers: headers,
      data: req, // Stream the incoming request to backend
      responseType: 'stream',
      validateStatus: () => true, // Forward all status codes
    });

    // Copy generic response headers
    res.status(response.status);
    if (response.headers) {
      Object.keys(response.headers).forEach(key => {
        res.set(key, response.headers[key]);
      });
    }

    response.data.pipe(res);

  } catch (err) {
    console.error("Proxy Error:", err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: "Backend unavailable" });
    }
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

// CDN Proxy route removed - moving to R2

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