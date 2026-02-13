// Script to set multiple users as admin by UID
// Run with: npx tsx scripts/set-multiple-admins.ts UID1 UID2 ...
// Or: node -r dotenv/config -r ts-node/register scripts/set-multiple-admins.ts UID1 UID2

import * as admin from 'firebase-admin';
import { db } from '../lib/firebase-admin';

async function setAdminByUid(uid: string) {
  try {
    console.log(`\n🔍 Looking up user: ${uid}...`);

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      console.error(`❌ User with UID ${uid} not found.`);
      return false;
    }

    const userData = userDoc.data()!;
    console.log(`✅ Found user: ${userData.email || userData.username || uid}`);
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
  } catch (error: any) {
    console.error(`❌ Error setting admin for ${uid}:`, error.message);
    return false;
  }
}

async function main() {
  const uids = process.argv.slice(2);
  
  if (uids.length === 0) {
    console.error('❌ Please provide at least one UID:');
    console.error('   npx tsx scripts/set-multiple-admins.ts UID1 UID2 ...');
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

