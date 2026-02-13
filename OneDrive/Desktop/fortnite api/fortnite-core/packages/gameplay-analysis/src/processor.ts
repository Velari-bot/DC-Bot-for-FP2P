/**
 * Process gameplay analysis job
 */

import { parseReplayFile, parseVideoClip } from './parser';
import {
  detectFights,
  detectHighgroundLoss,
  detectNoHealAfterFight,
  detectStormExposure,
  calculateMetrics,
  PlayerTick
} from './heuristics';
import { generateAnalysis } from './analysis-generator';
import { saveResult } from './utils/storage';
import { deleteFileSafe } from './utils/fileCleanup';
import { AnalysisResult, RawEvent } from './types';

export interface ProcessJobData {
  jobId: string;
  filePath: string;
  type: 'replay' | 'clip';
  playerId: string;
  startTime?: number;
  endTime?: number;
  playstyleId?: string;
}

export async function processAnalysisJob(data: ProcessJobData): Promise<AnalysisResult> {
  const { filePath, type, playerId, startTime, endTime, jobId } = data;
  
  try {
    // Parse input file
    let parsedData;
    if (type === 'replay') {
      parsedData = await parseReplayFile(filePath, playerId);
    } else {
      parsedData = await parseVideoClip(filePath, playerId, startTime, endTime);
    }

    // Convert RawEvents to PlayerTicks for heuristics
    const ticks: PlayerTick[] = parsedData.events.map((e: RawEvent) => {
      const tick: PlayerTick = {
        time: e.timestamp,
        hp: e.data?.hp || 100,
        shields: e.data?.shields,
        position: e.data?.position ? { x: e.data.position.x, y: e.data.position.y, z: e.data.position.z } : undefined,
        event: e.type === 'damage_dealt' || e.type === 'damage_taken' ? 'damage' : 
               e.type === 'healing' || e.type === 'item_used' ? 'heal' : 
               e.type === 'building' || e.type === 'edit' ? 'build' : undefined,
        damage: e.type === 'damage_dealt' || e.type === 'damage_taken' ? (e.data?.amount || 0) : undefined,
        weapon: e.data?.weapon
      };
      return tick;
    });

    // Extract event types for additional processing
    const positionEvents = ticks.filter(t => t.position);
    const buildingEvents = ticks.filter(t => t.event === 'build');

    // Detect events using heuristics
    const fights = detectFights(ticks);
    detectHighgroundLoss(fights, positionEvents, buildingEvents);
    const fightsWithHeal = detectNoHealAfterFight(fights, ticks);
    const rotations = detectStormExposure(ticks);

    // Calculate metrics
    const metrics = calculateMetrics(fightsWithHeal, parsedData.events, rotations);

    // Generate analysis
    const analysis = generateAnalysis(fightsWithHeal, rotations, [], metrics);

    // Save result
    await saveResult(jobId, analysis);

    // Clean up uploaded file after processing
    deleteFileSafe(filePath);

    return analysis;
  } catch (error) {
    console.error('Error processing analysis job:', error);
    // Clean up file even on error
    deleteFileSafe(filePath);
    throw error;
  }
}

