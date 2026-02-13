/**
 * REST API endpoints for gameplay analysis
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs-extra';
import { getAnalysisQueue, getRedisConnection } from './queue';
import { loadResult, deleteResult } from './utils/storage';
import { deleteFileSafe } from './utils/fileCleanup';
import { ProcessJobData } from './processor';

const router = express.Router();

// Configure upload directory
const uploadDir = path.join(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '524288000', 10); // 500 MB default

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.replay', '.mp4', '.mov', '.avi'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

/**
 * POST /api/analyze
 * Accept replay or clip and return job id
 */
router.post('/api/analyze', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'file required' });
    }

    const { playerId, type, startTime, endTime, playstyleId } = req.body;

    const jobId = uuidv4();
    const jobData: ProcessJobData = {
      jobId,
      playerId: playerId || 'anonymous',
      type: (type || 'replay') as 'replay' | 'clip',
      filePath: file.path,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
      playstyleId
    };

    // Check if user wants raw data instead of analysis
    const returnRawData = req.query.raw === 'true' || req.body.raw === true;
    
    if (returnRawData) {
      // Extract and return raw data
      try {
        const { parseReplayFile, parseVideoClip } = await import('./parser');
        
        let parsedData;
        if (type === 'replay') {
          parsedData = await parseReplayFile(file.path, playerId || 'all');
        } else {
          parsedData = await parseVideoClip(file.path, playerId || 'all', startTime ? Number(startTime) : undefined, endTime ? Number(endTime) : undefined);
        }

        const events = parsedData.events || [];
        res.json({
          success: true,
          file: file.originalname,
          type: type || 'replay',
          player_id: parsedData.player_id,
          duration: parsedData.duration || 0,
          total_events: events.length,
          metadata: parsedData.metadata || {},
          events: events,
          // WARNING: Current parser uses basic byte pattern matching
          parser_warning: 'Basic parser - data may be inaccurate. Consider using a proper Fortnite replay parser library for production use.',
          stats: {
            eliminations: events.filter((e: any) => e.type === 'elimination').length,
            deaths: events.filter((e: any) => e.type === 'death').length,
            damage_dealt: events.filter((e: any) => e.type === 'damage_dealt').length,
            damage_taken: events.filter((e: any) => e.type === 'damage_taken').length,
            position_updates: events.filter((e: any) => e.type === 'position').length,
            storm_updates: events.filter((e: any) => e.type === 'storm_update').length
          },
          // Event breakdown by player
          players: events.reduce((acc: any, e: any) => {
            const playerId = e.data?.player_id || e.data?.killer || e.data?.victim;
            if (playerId) {
              if (!acc[playerId]) {
                acc[playerId] = {
                  eliminations: 0,
                  deaths: 0,
                  damage_dealt: 0,
                  damage_taken: 0
                };
              }
              if (e.type === 'elimination') acc[playerId].eliminations++;
              if (e.type === 'death') acc[playerId].deaths++;
              if (e.type === 'damage_dealt') acc[playerId].damage_dealt += (e.data?.amount || 0);
              if (e.type === 'damage_taken') acc[playerId].damage_taken += (e.data?.amount || 0);
            }
            return acc;
          }, {})
        });

        deleteFileSafe(file.path);
        return;
      } catch (extractError) {
        console.error('Error extracting raw data:', extractError);
        deleteFileSafe(file.path);
        res.status(500).json({ 
          error: 'extraction_failed', 
          message: extractError instanceof Error ? extractError.message : 'Unknown error' 
        });
        return;
      }
    }

    // Check if Redis queue is available, if not process synchronously
    const queue = getAnalysisQueue();
    
    if (!queue) {
      // Process synchronously without trying Redis
      try {
        const { processAnalysisJob } = await import('./processor');
        const result = await processAnalysisJob(jobData);
        res.json({ 
          job_id: jobId, 
          status: 'complete', 
          analysis: result 
        });
      } catch (processError) {
        console.error('Error processing file:', processError);
        res.status(500).json({ 
          error: 'processing_failed', 
          message: processError instanceof Error ? processError.message : 'Unknown error' 
        });
      }
      return;
    }
    
    // Try to add to queue if Redis is available
    try {
      await queue.add(jobId, jobData);
      res.json({ job_id: jobId, status: 'queued' });
    } catch (queueError: any) {
      // Fallback to synchronous processing
      try {
        const { processAnalysisJob } = await import('./processor');
        const result = await processAnalysisJob(jobData);
        res.json({ 
          job_id: jobId, 
          status: 'complete', 
          analysis: result 
        });
      } catch (processError) {
        console.error('Error processing file:', processError);
        res.status(500).json({ 
          error: 'processing_failed', 
          message: processError instanceof Error ? processError.message : 'Unknown error' 
        });
      }
    }
  } catch (err) {
    console.error('Error in POST /api/analyze:', err);
    res.status(500).json({ 
      error: 'internal_error',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analyze/:jobId
 * Get job status and analysis result
 */
router.get('/api/analyze/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const result = loadResult(jobId);
    
    if (!result) {
      // Check if job is still in queue (only if Redis is available)
      const queue = getAnalysisQueue();
      if (queue) {
        try {
          const job = await queue.getJob(jobId);
          if (job) {
            const state = await job.getState();
            return res.json({
              job_id: jobId,
              status: state === 'completed' ? 'complete' : state === 'failed' ? 'failed' : state === 'active' ? 'processing' : 'queued'
            });
          }
        } catch (e) {
          // Redis not available, job was processed synchronously
        }
      }
      return res.json({ job_id: jobId, status: 'processing' });
    }
    
    res.json({ job_id: jobId, status: 'complete', analysis: result });
  } catch (err) {
    console.error('Error in GET /api/analyze/:jobId:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * DELETE /api/analyze/:jobId
 * Cancel or delete analysis result
 */
router.delete('/api/analyze/:jobId', async (req: Request, res: Response) => {
      try {
        const { jobId } = req.params;
        
        // Cancel job in queue if it exists (only if Redis is available)
        const queue = getAnalysisQueue();
        if (queue) {
          try {
            const job = await queue.getJob(jobId);
            if (job) {
              await job.remove();
            }
          } catch (e) {
            // Redis not available, skip queue operations
          }
        }
        
        // Delete result file
        deleteResult(jobId);
        
        res.json({ job_id: jobId, status: 'deleted' });
      } catch (err) {
        console.error('Error in DELETE /api/analyze/:jobId:', err);
        res.status(500).json({ error: 'internal_error' });
      }
});

/**
 * POST /api/extract
 * Extract raw data from replay/clip without analysis
 */
router.post('/api/extract', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'file required' });
    }

    const { playerId, type, startTime, endTime } = req.body;

    try {
      const { parseReplayFile, parseVideoClip } = await import('./parser');
      
      let parsedData;
      if (type === 'replay') {
        parsedData = await parseReplayFile(file.path, playerId || 'all');
      } else {
        parsedData = await parseVideoClip(file.path, playerId || 'all', startTime ? Number(startTime) : undefined, endTime ? Number(endTime) : undefined);
      }

      // Return raw extracted data with full details
      const events = parsedData.events || [];
      res.json({
        success: true,
        file: file.originalname,
        type: type || 'replay',
        player_id: parsedData.player_id,
        duration: parsedData.duration || 0,
        total_events: events.length,
        metadata: parsedData.metadata || {},
        events: events,
        // WARNING: Current parser uses basic byte pattern matching
        // May contain false positives and incomplete data
        parser_warning: 'Basic parser - data may be inaccurate. Consider using a proper Fortnite replay parser library for production use.',
        // Summary stats
        stats: {
          eliminations: events.filter((e: any) => e.type === 'elimination').length,
          deaths: events.filter((e: any) => e.type === 'death').length,
          damage_dealt: events.filter((e: any) => e.type === 'damage_dealt').length,
          damage_taken: events.filter((e: any) => e.type === 'damage_taken').length,
          position_updates: events.filter((e: any) => e.type === 'position').length,
          storm_updates: events.filter((e: any) => e.type === 'storm_update').length
        },
        // Event breakdown by player (if available)
        players: events.reduce((acc: any, e: any) => {
          const playerId = e.data?.player_id || e.data?.killer || e.data?.victim;
          if (playerId) {
            if (!acc[playerId]) {
              acc[playerId] = {
                eliminations: 0,
                deaths: 0,
                damage_dealt: 0,
                damage_taken: 0
              };
            }
            if (e.type === 'elimination') acc[playerId].eliminations++;
            if (e.type === 'death') acc[playerId].deaths++;
            if (e.type === 'damage_dealt') acc[playerId].damage_dealt += (e.data?.amount || 0);
            if (e.type === 'damage_taken') acc[playerId].damage_taken += (e.data?.amount || 0);
          }
          return acc;
        }, {})
      });

      // Clean up file after extraction
      deleteFileSafe(file.path);
    } catch (processError) {
      console.error('Error extracting data:', processError);
      deleteFileSafe(file.path);
      res.status(500).json({ 
        error: 'extraction_failed', 
        message: processError instanceof Error ? processError.message : 'Unknown error' 
      });
    }
  } catch (err) {
    console.error('Error in POST /api/extract:', err);
    res.status(500).json({ 
      error: 'internal_error',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

export default router;

