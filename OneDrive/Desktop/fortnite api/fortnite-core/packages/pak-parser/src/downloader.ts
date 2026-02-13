/**
 * PAK Downloader
 * Downloads PAK file headers using range requests
 */

import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { loadJSON } from '@fortnite-core/database';

const HEADER_SIZE = 1024 * 1024; // 1MB for headers

/**
 * Download PAK file header using range request
 */
async function downloadPakHeader(pakUrl: string, outputPath: string): Promise<void> {
  try {
    console.log(`Downloading header: ${pakUrl}`);
    
    // Make a range request for the first 1MB
    const response = await axios.get(pakUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Range': `bytes=0-${HEADER_SIZE - 1}`
      }
    });
    
    // Save the header
    await fs.writeFile(outputPath, response.data);
    
    console.log(`Saved header to: ${outputPath}`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 206) {
      // 206 Partial Content is expected for range requests
      const outputPath = path.join(process.cwd(), 'data', 'raw', 'paks', path.basename(pakUrl));
      await fs.writeFile(outputPath, error.response.data);
      console.log(`Saved header to: ${outputPath}`);
    } else {
      console.error(`Error downloading header for ${pakUrl}:`, error);
      throw error;
    }
  }
}

/**
 * Download all PAK file headers from pakList.json
 */
export async function downloadPakHeaders(): Promise<string[]> {
  console.log('Starting PAK header download...');
  
  try {
    // Load pak list from database
    const pakList = await loadJSON('raw/pakList.json');
    
    if (!pakList || !pakList.files || pakList.files.length === 0) {
      console.error('No PAK files found in pakList.json');
      return [];
    }
    
    const pakFiles = pakList.files;
    console.log(`Found ${pakFiles.length} PAK files to download headers for`);
    
    // Create output directory
    const outputDir = path.join(process.cwd(), 'data', 'raw', 'paks');
    await fs.ensureDir(outputDir);
    
    const downloadedPaths: string[] = [];
    
    // Limit to first 10 to avoid being rate-limited
    const filesToDownload = pakFiles.slice(0, 10);
    
    for (const pakFile of filesToDownload) {
      try {
        // Convert filename to URL (assuming CDN path structure)
        const pakUrl = convertToPakUrl(pakFile);
        
        // Create output path
        const outputPath = path.join(outputDir, `${path.basename(pakFile)}.bin`);
        
        // Skip if already downloaded
        if (await fs.pathExists(outputPath)) {
          console.log(`Skipping ${pakFile} - already exists`);
          downloadedPaths.push(outputPath);
          continue;
        }
        
        // Download header
        await downloadPakHeader(pakUrl, outputPath);
        downloadedPaths.push(outputPath);
        
      } catch (error) {
        console.error(`Error processing ${pakFile}:`, error);
      }
    }
    
    console.log(`✅ Downloaded ${downloadedPaths.length} PAK headers`);
    return downloadedPaths;
  } catch (error) {
    console.error('Error downloading PAK headers:', error);
    throw error;
  }
}

/**
 * Convert PAK filename to full URL
 */
function convertToPakUrl(filename: string): string {
  // This is a placeholder - in production, you'd construct the full CDN URL
  // Typical Epic CDN format: https://epicgames-download1.akamaized.net/...
  const baseUrl = 'https://epicgames-download1.akamaized.net/Builds/Fortnite/CloudDir';
  return `${baseUrl}/${filename}`;
}

/**
 * Download a single PAK header by filename
 */
export async function downloadPakHeaderByName(filename: string): Promise<string | null> {
  try {
    const pakUrl = convertToPakUrl(filename);
    const outputDir = path.join(process.cwd(), 'data', 'raw', 'paks');
    await fs.ensureDir(outputDir);
    
    const outputPath = path.join(outputDir, `${filename}.bin`);
    
    await downloadPakHeader(pakUrl, outputPath);
    return outputPath;
  } catch (error) {
    console.error(`Error downloading header for ${filename}:`, error);
    return null;
  }
}

