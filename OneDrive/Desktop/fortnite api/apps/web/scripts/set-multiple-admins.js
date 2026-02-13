// Script to set multiple users as admin by UID
// Run with: node scripts/set-multiple-admins.js UID1 UID2 ...

const path = require('path');
const fs = require('fs');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  let currentKey = null;
  let currentValue = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }
    
    // Check if this line starts a new key=value pair
    const keyMatch = line.match(/^([^=]+)=(.*)$/);
    if (keyMatch) {
      // Save previous key if exists
      if (currentKey) {
        process.env[currentKey] = currentValue.join('\n');
        currentValue = [];
      }
      
      currentKey = keyMatch[1].trim();
      const valuePart = keyMatch[2];
      
      // Check if value starts with { (JSON object)
      if (valuePart.trim().startsWith('{')) {
        currentValue.push(valuePart);
        // Continue reading until we find the closing brace
        let braceCount = (valuePart.match(/{/g) || []).length - (valuePart.match(/}/g) || []).length;
        while (braceCount > 0 && i + 1 < lines.length) {
          i++;
          const nextLine = lines[i];
          currentValue.push(nextLine);
          braceCount += (nextLine.match(/{/g) || []).length - (nextLine.match(/}/g) || []).length;
        }
        process.env[currentKey] = currentValue.join('\n');
        currentKey = null;
        currentValue = [];
      } else {
        // Simple value
        process.env[currentKey] = valuePart;
        currentKey = null;
      }
    } else if (currentKey) {
      // Continuation of previous value
      currentValue.push(line);
    }
  }
  
  // Save last key if exists
  if (currentKey) {
    process.env[currentKey] = currentValue.join('\n');
  }
}

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try environment variable first
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      let serviceAccount;
      try {
        let jsonStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        // Remove surrounding quotes if present
        if ((jsonStr.startsWith('"') && jsonStr.endsWith('"')) || 
            (jsonStr.startsWith("'") && jsonStr.endsWith("'"))) {
          jsonStr = jsonStr.slice(1, -1);
        }
        
        // The JSON might have actual newlines in .env.local
        // We need to escape newlines that are inside JSON string values
        // But preserve the JSON structure (newlines between properties are OK to remove)
        
        // First, try to parse as-is (in case it's already properly formatted)
        try {
          serviceAccount = JSON.parse(jsonStr);
        } catch (firstError) {
          // If that fails, the JSON might have unescaped newlines in string values
          // We need to escape newlines within string values only
          // This is tricky - let's try a simpler approach: replace all actual newlines with \n
          // But we need to be careful not to break the JSON structure
          
          // Replace actual newlines with escaped newlines
          // This handles multiline JSON in .env.local where newlines in string values aren't escaped
          jsonStr = jsonStr.replace(/\r\n/g, '\\n').replace(/\r/g, '\\n').replace(/\n/g, '\\n');
          
          // Now parse - JSON.parse will interpret \n as newline
          serviceAccount = JSON.parse(jsonStr);
        }
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('[INFO] Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS_JSON');
      } catch (parseError) {
        console.error('[ERROR] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', parseError.message);
        console.error('[INFO] Make sure the JSON is properly formatted in .env.local');
        console.error('[INFO] You can also use a service account file instead');
        process.exit(1);
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[INFO] Firebase Admin initialized with service account file');
    } else {
      // Try common paths
      const commonPaths = [
        path.join(__dirname, '..', 'firebase-service-account.json'),
        path.join(__dirname, '..', '..', 'firebase-service-account.json'),
        path.join(__dirname, '..', 'service-account.json'),
      ];

      let found = false;
      for (const credPath of commonPaths) {
        if (fs.existsSync(credPath)) {
          const serviceAccount = require(credPath);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('[INFO] Firebase Admin initialized with service account file:', credPath);
          found = true;
          break;
        }
      }

      if (!found) {
        console.error('❌ Firebase Admin not initialized.');
        console.error('   Please set GOOGLE_APPLICATION_CREDENTIALS_JSON in .env.local');
        console.error('   Or place firebase-service-account.json in apps/web/');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function findUser(identifier) {
  // Try as document ID first
  const userDoc = await db.collection('users').doc(identifier).get();
  if (userDoc.exists) {
    return { doc: userDoc, method: 'uid' };
  }
  
  // Try by username
  const usernameQuery = await db.collection('users')
    .where('username', '==', identifier)
    .limit(1)
    .get();
  if (!usernameQuery.empty) {
    return { doc: usernameQuery.docs[0], method: 'username' };
  }
  
  // Try by email
  const emailQuery = await db.collection('users')
    .where('email', '==', identifier)
    .limit(1)
    .get();
  if (!emailQuery.empty) {
    return { doc: emailQuery.docs[0], method: 'email' };
  }
  
  return null;
}

async function setAdminByUid(identifier) {
  try {
    console.log(`\n🔍 Looking up user: ${identifier}...`);

    const result = await findUser(identifier);
    
    if (!result) {
      console.error(`❌ User "${identifier}" not found.`);
      console.error(`   Tried: UID, username, and email`);
      
      // List some recent users to help
      console.log(`\n📋 Recent users in database:`);
      const recentUsers = await db.collection('users').limit(5).get();
      if (recentUsers.empty) {
        console.log(`   (No users found in database)`);
      } else {
        recentUsers.docs.forEach((doc, i) => {
          const data = doc.data();
          console.log(`   ${i + 1}. UID: ${doc.id}`);
          console.log(`      Username: ${data.username || 'N/A'}`);
          console.log(`      Email: ${data.email || 'N/A'}`);
        });
      }
      return false;
    }
    
    const userDoc = result.doc;
    const uid = userDoc.id;

    const userData = userDoc.data();
    console.log(`✅ Found user by ${result.method}: ${userData.email || userData.username || uid}`);
    console.log(`   UID: ${uid}`);
    console.log(`   Email: ${userData.email || 'N/A'}`);
    console.log(`   Username: ${userData.username || 'N/A'}`);
    console.log(`   Current role: ${userData.role || 'user'}`);
    console.log(`   Current isAdmin: ${userData.isAdmin || false}`);

    await db.collection('users').doc(uid).update({
      role: 'owner',
      isAdmin: true,
    });

    console.log(`✅ Successfully set ${uid} as owner/admin!`);
    return true;
  } catch (error) {
    console.error(`❌ Error setting admin for ${uid}:`, error.message);
    return false;
  }
}

async function main() {
  const uids = process.argv.slice(2);
  
  if (uids.length === 0) {
    console.error('❌ Please provide at least one UID:');
    console.error('   node scripts/set-multiple-admins.js UID1 UID2 ...');
    process.exit(1);
  }

  console.log('========================================');
  console.log('  Setting Multiple Users as Admin');
  console.log('========================================');
  console.log(`\n📋 Users to set as admin: ${uids.length}`);
  uids.forEach((uid, i) => {
    console.log(`   ${i + 1}. ${uid}`);
  });

  let successCount = 0;
  let failCount = 0;

  for (const uid of uids) {
    const success = await setAdminByUid(uid);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('\n🎉 Done!');
  
  if (successCount > 0) {
    console.log('\n💡 Users can now:');
    console.log('   - Access /admin dashboard');
    console.log('   - Use admin API endpoints');
    console.log('   - Access all pages before launch');
  }
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

