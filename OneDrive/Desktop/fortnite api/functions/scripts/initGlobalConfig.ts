// PathGen Backend — Fortnite AI Coach
// Script to initialize global config document

import * as admin from "firebase-admin";
import * as readline from "readline";

// Initialize Firebase Admin
const serviceAccount = require("../../pathgen-v2-firebase-adminsdk.json"); // Update path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function initializeGlobalConfig() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
  };

  try {
    console.log("Initializing global config for PathGen...\n");

    const freeMessageLimit = parseInt(await question("Free tier message limit (default 50): ")) || 50;
    const freeVoiceLimit = parseInt(await question("Free tier voice limit in seconds (default 300): ")) || 300;
    const priceMonthly = parseFloat(await question("Pro monthly price (default 9.99): ")) || 9.99;
    const priceYearly = parseFloat(await question("Pro yearly price (default 99.99): ")) || 99.99;
    const currentPatch = await question("Current Fortnite patch (default 'v30.00'): ") || "v30.00";

    const configData = {
      freeMessageLimit: freeMessageLimit,
      freeVoiceLimit: freeVoiceLimit,
      price_pro_monthly: priceMonthly,
      price_pro_yearly: priceYearly,
      currentFortnitePatch: currentPatch,
      lastUpdated: admin.firestore.Timestamp.now(),
    };

    await db.collection("config").doc("global").set(configData);

    console.log("\n✅ Global config initialized successfully!");
    console.log(JSON.stringify(configData, null, 2));

    rl.close();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error initializing config:", error);
    rl.close();
    process.exit(1);
  }
}

initializeGlobalConfig();
