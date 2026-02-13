// PathGen Backend — Fortnite AI Coach
// Firebase Admin initialization for Next.js server-side

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin (singleton pattern)
if (!admin.apps.length) {
  try {
    let initialized = false;

    // Option 1: Service account JSON from environment variable (recommended for Vercel and local)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        // Try to parse the JSON - handle both string and already-parsed objects
        let serviceAccount;
        if (typeof process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON === 'string') {
          let jsonStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON.trim();
          
          // Remove surrounding quotes if present (single or double)
          if ((jsonStr.startsWith('"') && jsonStr.endsWith('"')) ||
              (jsonStr.startsWith("'") && jsonStr.endsWith("'"))) {
            jsonStr = jsonStr.slice(1, -1);
          }
          
          // Handle multi-line JSON from .env.local
          // If the JSON contains actual newlines (not escaped), we need to normalize them
          // Private keys in JSON service accounts often have \n which should stay as \n in the parsed string
          
          try {
            // First try parsing as-is (works if JSON is properly formatted)
            serviceAccount = JSON.parse(jsonStr);
          } catch (firstParseError: any) {
            // If that fails, the JSON might have actual newlines where there should be \n
            // Try replacing actual newlines with escaped newlines in string values
            // This is tricky - we need to be careful not to break the JSON structure
            
            // Replace \r\n and \r with \n first
            jsonStr = jsonStr.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            
            // Try to fix unescaped newlines in string values
            // Match: "key": "value\nwith\nnewlines" and fix the newlines inside quotes
            jsonStr = jsonStr.replace(/("(?:[^"\\]|\\.)*")\s*:\s*"([^"]*?)"/g, (match, key, value) => {
              // If value has actual newlines, escape them
              if (value.includes('\n')) {
                const escapedValue = value.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                return `${key}: "${escapedValue}"`;
              }
              return match;
            });
            
            // Try parsing again
            try {
              serviceAccount = JSON.parse(jsonStr);
            } catch (secondParseError: any) {
              // Last resort: if it still fails, try reading from the file directly if it exists
              // Sometimes Next.js doesn't load multi-line env vars properly
              const secondMsg = secondParseError?.message || String(secondParseError);
              const firstMsg = firstParseError?.message || String(firstParseError);
              throw new Error(`Failed to parse JSON: ${secondMsg}. Original error: ${firstMsg}`);
            }
          }
        } else {
          serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        }

        // Validate it's a service account object
        if (!serviceAccount.type || serviceAccount.type !== 'service_account') {
          throw new Error('Invalid service account JSON: missing or incorrect type field');
        }
        if (!serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error('Invalid service account JSON: missing required fields');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('[INFO] Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS_JSON');
        initialized = true;
      } catch (parseError: any) {
        console.error('[ERROR] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', parseError.message);
        const jsonValue = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '';
        console.error('[ERROR] JSON value length:', jsonValue.length);
        console.error('[ERROR] First 200 chars:', jsonValue.substring(0, 200));
        console.error('[ERROR] Last 50 chars:', jsonValue.substring(Math.max(0, jsonValue.length - 50)));
        console.error('[ERROR] This usually means:');
        console.error('[ERROR]   1. The JSON is malformed (check for trailing commas, missing quotes)');
        console.error('[ERROR]   2. The JSON is double-encoded (has extra quotes or escapes)');
        console.error('[ERROR]   3. The JSON has line breaks that need to be escaped');
        console.error('[ERROR] Fix by: Running setup-local-firebase.ps1 or manually setting correct JSON in .env.local');
        // Continue to try other methods
      }
    }

    // Option 2: Service account file path (for local development)
    if (!initialized && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        // Handle both absolute and relative paths
        let fullPath: string;
        if (path.isAbsolute(credentialsPath)) {
          fullPath = credentialsPath;
        } else {
          // Resolve relative path from current working directory (apps/web in Next.js)
          fullPath = path.resolve(process.cwd(), credentialsPath);
        }

        // Normalize the path to handle spaces and slashes correctly
        fullPath = path.normalize(fullPath);

        if (fs.existsSync(fullPath)) {
          // Use JSON.parse instead of require to avoid caching issues
          const serviceAccountData = fs.readFileSync(fullPath, 'utf8');
          const serviceAccount = JSON.parse(serviceAccountData);
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('[INFO] Firebase Admin initialized with service account file:', fullPath);
          initialized = true;
        } else {
          console.warn('[WARNING] Service account file not found:', fullPath);
          console.warn('[WARNING] Current working directory:', process.cwd());
          console.warn('[WARNING] Resolved path:', fullPath);
        }
      } catch (fileError: any) {
        console.error('[ERROR] Failed to load service account file:', fileError.message);
        console.error('[ERROR] Error stack:', fileError.stack);
      }
    }

    // Option 3: Try to find service account in common locations (local development)
    if (!initialized && process.env.NODE_ENV !== 'production') {
      const commonPaths = [
        path.join(process.cwd(), 'firebase-service-account.json'),
        path.join(process.cwd(), 'service-account.json'),
        path.join(process.cwd(), 'apps', 'web', 'firebase-service-account.json'),
        path.join(process.cwd(), 'apps', 'web', 'service-account.json'),
      ];

      for (const credPath of commonPaths) {
        if (fs.existsSync(credPath)) {
          try {
            const serviceAccount = require(credPath);
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
            console.log('[INFO] Firebase Admin initialized with service account file:', credPath);
            initialized = true;
            break;
          } catch (loadError: any) {
            console.warn('[WARNING] Failed to load service account from:', credPath, loadError.message);
          }
        }
      }
    }

    // Option 4: Use default credentials with project ID (works if Vercel has Google Cloud access)
    if (!initialized && process.env.FIREBASE_PROJECT_ID) {
      try {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        console.log('[INFO] Firebase Admin initialized with project ID (default credentials)');
        initialized = true;
      } catch (defaultError: any) {
        console.warn('[WARNING] Failed to initialize with default credentials:', defaultError.message);
      }
    }

    // Option 5: Fallback (will likely fail but allows app to start)
    if (!initialized) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pathgen-v2';
      try {
        admin.initializeApp({
          projectId: projectId,
        });
        console.warn('[WARNING] Firebase Admin initialized with fallback project ID - may not have write permissions');
        console.warn('[WARNING] For local development, set GOOGLE_APPLICATION_CREDENTIALS_JSON in .env.local');
        initialized = true;
      } catch (fallbackError: any) {
        console.error('[ERROR] Failed to initialize Firebase Admin with fallback:', fallbackError.message);
        console.error('[ERROR] Please set GOOGLE_APPLICATION_CREDENTIALS_JSON in .env.local for local development');
      }
    }
  } catch (error: any) {
    // If already initialized, ignore
    if (!error.message?.includes('already initialized')) {
      console.error('[ERROR] Firebase Admin initialization error:', error);
      console.error('[ERROR] Error message:', error.message);
      console.error('[ERROR] Error stack:', error.stack);
      // Don't throw - will fail on first access if not initialized
    }
  }
}

// Initialize Firestore database
let db: admin.firestore.Firestore;
try {
  db = admin.firestore();
  console.log('[INFO] Firebase Admin Firestore initialized successfully');
} catch (error: any) {
  console.error('[ERROR] Failed to initialize Firestore:', error);
  // Create a placeholder to prevent import errors
  // Actual error will be caught when db is used
  db = admin.firestore();
}

export { db, admin };


