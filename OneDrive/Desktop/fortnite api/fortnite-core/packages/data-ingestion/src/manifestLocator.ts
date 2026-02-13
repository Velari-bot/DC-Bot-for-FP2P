/**
 * Manifest Locator
 * Locates and downloads the latest Fortnite manifest files
 */

import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Buffer } from 'buffer';

const DISTRIBUTION_URL = 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/distributionpoints/';

/**
 * Recursively search for all URLs in an object
 */
function findAllUrls(obj: any, urls: string[]): void {
  if (typeof obj === 'string') {
    // Check if it's a URL
    if (obj.startsWith('http://') || obj.startsWith('https://')) {
      urls.push(obj);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(item => findAllUrls(item, urls));
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(value => findAllUrls(value, urls));
  }
}

/**
 * Filter URLs to only .manifest files
 */
function filterManifestUrls(urls: string[]): string[] {
  return urls.filter(url => url.includes('.manifest'));
}

/**
 * Find FortniteContentBuilds manifest URL
 */
function findFortniteContentBuildsManifest(urls: string[]): string | null {
  return urls.find(url => 
    url.includes('.manifest') && 
    (url.includes('FortniteContentBuilds') || url.includes('Fortnite-'))
  ) || null;
}

/**
 * Download file from URL
 */
async function downloadFile(url: string, destination: string): Promise<void> {
  console.log(`Downloading: ${url}`);
  
  const response = await axios.get(url, {
    responseType: 'arraybuffer'
  });
  
  const buffer = Buffer.from(response.data);
  await fs.writeFile(destination, buffer);
  
  console.log(`Saved to: ${destination}`);
}

/**
 * Fetch latest manifest from distribution points
 */
export async function fetchLatestManifest(): Promise<string | null> {
  console.log('Fetching distribution points...');
  
  try {
    // Fetch distribution points
    const response = await axios.get(DISTRIBUTION_URL);
    const distributionData = response.data;
    
    // Extract all URLs
    const allUrls: string[] = [];
    findAllUrls(distributionData, allUrls);
    
    console.log(`Found ${allUrls.length} URLs`);
    
    // Filter for manifest URLs
    const manifestUrls = filterManifestUrls(allUrls);
    console.log(`Found ${manifestUrls.length} manifest URLs`);
    
    // Find FortniteContentBuilds manifest
    const manifestUrl = findFortniteContentBuildsManifest(manifestUrls);
    
    if (!manifestUrl) {
      console.warn('No FortniteContentBuilds manifest found');
      console.log('Available manifest URLs:');
      manifestUrls.slice(0, 10).forEach(url => console.log(`  - ${url}`));
      return null;
    }
    
    console.log(`Found FortniteContentBuilds manifest: ${manifestUrl}`);
    
    // Download the manifest
    const manifestDir = path.join(process.cwd(), 'data', 'raw');
    await fs.ensureDir(manifestDir);
    const manifestPath = path.join(manifestDir, 'latest-manifest.manifest');
    
    await downloadFile(manifestUrl, manifestPath);
    
    console.log('✅ Manifest downloaded');
    
    return manifestPath;
  } catch (error) {
    console.error('Error fetching manifest:', error);
    throw error;
  }
}

/**
 * Get the path to the latest manifest file
 */
export async function getLatestManifestPath(): Promise<string | null> {
  const manifestPath = path.join(process.cwd(), 'data', 'raw', 'latest-manifest.manifest');
  
  // Check if file exists
  if (await fs.pathExists(manifestPath)) {
    console.log('Using existing manifest:', manifestPath);
    return manifestPath;
  }
  
  // If not found, fetch new one
  console.log('No existing manifest found, fetching new one...');
  return await fetchLatestManifest();
}

/**
 * Download all manifests from distribution points
 */
export async function downloadAllManifests(): Promise<string[]> {
  console.log('Downloading all manifests...');
  
  try {
    const response = await axios.get(DISTRIBUTION_URL);
    const distributionData = response.data;
    
    const allUrls: string[] = [];
    findAllUrls(distributionData, allUrls);
    
    const manifestUrls = filterManifestUrls(allUrls);
    console.log(`Found ${manifestUrls.length} manifest URLs to download`);
    
    const manifestDir = path.join(process.cwd(), 'data', 'raw', 'manifests');
    await fs.ensureDir(manifestDir);
    
    const downloadedPaths: string[] = [];
    
    for (let i = 0; i < manifestUrls.length; i++) {
      const url = manifestUrls[i];
      const filename = path.basename(url).replace(/[^a-z0-9.]/gi, '_');
      const destPath = path.join(manifestDir, filename);
      
      try {
        await downloadFile(url, destPath);
        downloadedPaths.push(destPath);
        
        // Limit to first 5 to avoid being rate-limited
        if (i >= 4) {
          console.log('Limiting downloads to first 5 manifests');
          break;
        }
      } catch (error) {
        console.error(`Error downloading ${url}:`, error);
      }
    }
    
    console.log(`✅ Downloaded ${downloadedPaths.length} manifests`);
    return downloadedPaths;
  } catch (error) {
    console.error('Error downloading manifests:', error);
    throw error;
  }
}

