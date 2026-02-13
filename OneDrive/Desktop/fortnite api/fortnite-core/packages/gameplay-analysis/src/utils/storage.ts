/**
 * Storage utilities for analysis results
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { AnalysisResult } from '../types';

const RESULTS_DIR = process.env.RESULTS_DIR || path.join(process.cwd(), 'data', 'analysis-results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

export async function saveResult(jobId: string, analysis: AnalysisResult): Promise<void> {
  const file = path.join(RESULTS_DIR, `${jobId}.json`);
  await fs.writeJSON(file, analysis, { spaces: 2 });
}

export function loadResult(jobId: string): AnalysisResult | null {
  const file = path.join(RESULTS_DIR, `${jobId}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as AnalysisResult;
  } catch (e) {
    console.error(`Error loading result for ${jobId}:`, e);
    return null;
  }
}

export function deleteResult(jobId: string): void {
  const file = path.join(RESULTS_DIR, `${jobId}.json`);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

