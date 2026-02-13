/**
 * Replay Uploader
 * Handles replay file uploads
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parseAndSaveReplay } from './index';

export interface UploadResult {
  success: boolean;
  fileName: string;
  filePath: string;
  error?: string;
}

/**
 * Save uploaded replay file and parse it
 */
export async function saveAndParseReplay(
  fileBuffer: Buffer,
  originalFileName: string
): Promise<UploadResult> {
  console.log(`Processing replay upload: ${originalFileName}`);
  
  try {
    // Generate unique ID for the file
    const fileId = uuidv4();
    const extension = path.extname(originalFileName);
    
    // Create replays directory if it doesn't exist
    const replaysDir = path.join(process.cwd(), 'data', 'replays');
    await fs.ensureDir(replaysDir);
    
    // Save file with UUID
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(replaysDir, fileName);
    
    await fs.writeFile(filePath, fileBuffer);
    console.log(`Saved replay file: ${filePath}`);
    
    // Parse the replay file
    try {
      await parseAndSaveReplay(filePath);
      console.log(`Parsed replay: ${fileId}`);
    } catch (parseError) {
      console.warn(`Warning: Failed to parse replay ${fileId}:`, parseError);
    }
    
    return {
      success: true,
      fileName,
      filePath
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error processing replay upload: ${errorMessage}`);
    
    return {
      success: false,
      fileName: originalFileName,
      filePath: '',
      error: errorMessage
    };
  }
}

/**
 * List all uploaded replay files
 */
export async function listReplayFiles(): Promise<string[]> {
  const replaysDir = path.join(process.cwd(), 'data', 'replays');
  
  if (!await fs.pathExists(replaysDir)) {
    return [];
  }
  
  const files = await fs.readdir(replaysDir);
  return files.filter(f => f.endsWith('.replay'));
}

/**
 * Get replay file path by ID
 */
export function getReplayFilePath(fileId: string): string {
  return path.join(process.cwd(), 'data', 'replays', `${fileId}.replay`);
}

/**
 * Delete replay file
 */
export async function deleteReplayFile(fileId: string): Promise<boolean> {
  try {
    const filePath = getReplayFilePath(fileId);
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      console.log(`Deleted replay file: ${fileId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error deleting replay file: ${error}`);
    return false;
  }
}

