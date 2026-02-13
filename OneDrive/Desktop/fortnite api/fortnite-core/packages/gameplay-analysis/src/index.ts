/**
 * Gameplay Analysis Microservice
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';
import apiRouter from './api';
import { createLocalWorker } from './queue';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const app = express();
// Use GAMEPLAY_ANALYSIS_PORT first to avoid conflicts with main API server
// Explicitly set to 3001 to avoid conflicts with main API on port 3000
// Don't use process.env.PORT as it might be set to 3000 for the main API
const PORT = parseInt(
  process.env.GAMEPLAY_ANALYSIS_PORT || 
  process.env.PORT_GAMEPLAY_ANALYSIS || 
  '3001', 
  10
);

// Ensure we're not using port 3000 (reserved for main API)
const FINAL_PORT = PORT === 3000 ? 3001 : PORT;
if (PORT === 3000) {
  console.warn('⚠️  Port 3000 is reserved for the main API server. Using 3001 instead.');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use(apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const server = app.listen(FINAL_PORT, () => {
  console.log(`🎮 Gameplay Analysis service running on port ${FINAL_PORT}`);
  console.log(`📚 API: http://localhost:${FINAL_PORT}/api/analyze`);
});

// Start a local worker when running in dev mode
// Skip if Redis is not available (silent fail)
if (process.env.NODE_ENV !== 'production') {
  // Don't try to start worker if Redis isn't available
  // The API will process jobs synchronously instead
  // Worker will be created automatically if Redis becomes available
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});

export default app;

