/**
 * Manifest Parser
 * Parses Fortnite manifest files
 */

import axios from 'axios';
import { Buffer } from 'buffer';
import * as path from 'path';
import * as fs from 'fs-extra';
import { saveRawData, loadJSON } from '@fortnite-core/database';

export interface ManifestResult {
  url: string;
  data?: ParsedManifest;
  error?: string;
}

export interface ParsedManifest {
  header: ManifestHeader;
  files: ManifestFile[];
  pakFiles: string[];
}

export interface ManifestHeader {
  name: string;
  version: number;
  hash: string;
}

export interface ManifestFile {
  chunkId: string;
  filename: string;
  sha: string;
  size?: number;
}

/**
 * Parse Unreal Engine manifest binary structure
 */
function parseManifestBuffer(buffer: Buffer): ParsedManifest {
  // Unreal Engine manifest structure
  // Typically starts with a magic number and version
  let offset = 0;
  
  // Read header (simplified - actual format may vary)
  // Epic manifests often start with version info
  const version = buffer.readUInt32LE(offset);
  offset += 4;
  
  // Read number of files
  const numFiles = buffer.readUInt32LE(offset);
  offset += 4;
  
  const files: ManifestFile[] = [];
  const pakFiles: string[] = [];
  
  // Parse file entries
  for (let i = 0; i < numFiles; i++) {
    try {
      // Read chunk ID (16 bytes GUID)
      const chunkId = buffer.subarray(offset, offset + 16).toString('hex');
      offset += 16;
      
      // Read filename length
      const filenameLength = buffer.readUInt32LE(offset);
      offset += 4;
      
      // Read filename
      const filename = buffer.subarray(offset, offset + filenameLength).toString('utf8');
      offset += filenameLength;
      
      // Read SHA hash (20 bytes)
      const sha = buffer.subarray(offset, offset + 20).toString('hex');
      offset += 20;
      
      // Read file size if present
      let size: number | undefined;
      if (offset < buffer.length - 4) {
        size = buffer.readUInt32LE(offset);
        offset += 4;
      }
      
      files.push({
        chunkId,
        filename,
        sha,
        size
      });
      
      // Extract .pak files
      if (filename.endsWith('.pak')) {
        pakFiles.push(filename);
      }
    } catch (error) {
      console.warn(`Error parsing file entry ${i}:`, error);
      break;
    }
  }
  
  return {
    header: {
      name: 'Fortnite Manifest',
      version,
      hash: 'unknown'
    },
    files,
    pakFiles
  };
}

/**
 * Parse manifest from text content (JSON or plain text)
 */
function parseManifestText(content: string): ParsedManifest {
  const lines = content.split('\n');
  const files: ManifestFile[] = [];
  const pakFiles: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Handle different manifest formats
    // Epic manifests often use tab-separated or space-separated values
    const parts = trimmed.split(/\s+/);
    
    if (parts.length >= 2) {
      const filename = parts[parts.length - 1]; // Usually last element
      const chunkId = parts[0] || 'unknown';
      const sha = parts[1] || 'unknown';
      
      files.push({
        chunkId,
        filename,
        sha
      });
      
      if (filename.endsWith('.pak')) {
        pakFiles.push(filename);
      }
    }
  }
  
  return {
    header: {
      name: 'Fortnite Manifest',
      version: 1,
      hash: 'unknown'
    },
    files,
    pakFiles
  };
}

/**
 * Download and parse a manifest file
 */
export const parseManifest = async (manifestUrl: string): Promise<ManifestResult> => {
  console.log(`Downloading manifest: ${manifestUrl}`);
  
  try {
    // Download manifest
    const response = await axios.get(manifestUrl, {
      responseType: 'arraybuffer'
    });
    
    const buffer = Buffer.from(response.data);
    let parsedData: ParsedManifest;
    
    // Try to parse as binary first, then fall back to text
    try {
      parsedData = parseManifestBuffer(buffer);
      
      // If no files were parsed, try as text
      if (parsedData.files.length === 0) {
        const text = buffer.toString('utf8');
        parsedData = parseManifestText(text);
      }
    } catch (binaryError) {
      console.log('Binary parsing failed, trying text format...');
      const text = buffer.toString('utf8');
      parsedData = parseManifestText(text);
    }
    
    // Extract version from header
    const version = parsedData.header.version.toString();
    
    // Save manifest data to database
    const manifestDir = path.join(process.cwd(), 'data', 'raw', 'manifests');
    await fs.ensureDir(manifestDir);
    
    const manifestFile = path.join(manifestDir, `${version}.json`);
    await fs.writeJSON(manifestFile, parsedData, { spaces: 2 });
    console.log(`Saved manifest to: ${manifestFile}`);
    
    console.log(`Parsed ${parsedData.files.length} files, found ${parsedData.pakFiles.length} .pak files`);
    
    return {
      url: manifestUrl,
      data: parsedData
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error parsing manifest ${manifestUrl}:`, errorMessage);
    return {
      url: manifestUrl,
      error: errorMessage
    };
  }
};

/**
 * Parse multiple manifest files
 */
export const parseManifests = async (manifestUrls: string[]): Promise<ManifestResult[]> => {
  console.log(`Parsing ${manifestUrls.length} manifests...`);
  const results: ManifestResult[] = [];
  
  for (const url of manifestUrls) {
    try {
      const result = await parseManifest(url);
      results.push(result);
    } catch (error) {
      results.push({
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  console.log(`Completed parsing ${results.length} manifests`);
  return results;
};

/**
 * Parse latest manifest file and extract .pak files
 */
export async function parseLatestManifest(): Promise<string[]> {
  console.log('Parsing latest manifest...');
  
  try {
    const manifestPath = path.join(process.cwd(), 'data', 'raw', 'latest-manifest.manifest');
    
    if (!await fs.pathExists(manifestPath)) {
      console.error('Latest manifest not found:', manifestPath);
      return [];
    }
    
    console.log(`Reading manifest: ${manifestPath}`);
    const buffer = await fs.readFile(manifestPath);
    
    // Try to parse as binary first
    let pakFiles: string[] = [];
    
    try {
      // Parse binary manifest format
      const parsed = parseManifestBuffer(buffer);
      pakFiles = parsed.pakFiles;
      
      console.log(`Parsed ${pakFiles.length} .pak files from binary format`);
    } catch (binaryError) {
      console.log('Binary parsing failed, trying text format...');
      
      // Try parsing as text
      const text = buffer.toString('utf8');
      const textParsed = parseManifestText(text);
      pakFiles = textParsed.pakFiles;
      
      console.log(`Parsed ${pakFiles.length} .pak files from text format`);
    }
    
    // Save pak list to database
    await saveRawData('pakList.json', {
      count: pakFiles.length,
      files: pakFiles,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ PAK list extracted');
    console.log(`   Found ${pakFiles.length} .pak files`);
    
    return pakFiles;
  } catch (error) {
    console.error('Error parsing latest manifest:', error);
    throw error;
  }
}

/**
 * Get list of .pak filenames
 */
export async function getPakFilenames(): Promise<string[]> {
  // Try to load from database first
  const pakList = await loadJSON('raw/pakList.json');
  
  if (pakList && pakList.files) {
    console.log(`Loaded ${pakList.files.length} pak files from database`);
    return pakList.files;
  }
  
  // If not in database, parse fresh
  console.log('No pak list in database, parsing fresh...');
  return await parseLatestManifest();
}
