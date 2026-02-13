const axios = require('axios');
const admin = require('./firebaseAdmin');
const db = admin.firestore();

const rawToken = process.env.DISCORD_TOKEN || '';
const BOT_TOKEN = rawToken.replace(/"/g, '').trim();
const GUILD_ID = process.env.PUBLIC_SERVER_ID || process.env.DISCORD_GUILD_ID;

// Map Course/Product IDs to Discord Role IDs
const ROLE_MAPPING = {
    // Masterclasses
    'beginner_masterclass': '1444829030263165109',     // Beginner Course Role
    'intermediate_masterclass': '1444829519964930088', // Intermediate Course Role
    'advanced_masterclass': '1444829551984378027',     // Advanced Course Role
    'tO4MriPtFjmoksUbpXdQ': '1471937065229881355',     // Fighting Masterclass -> Fighting Role

    // Coaching & Services
    'single_coaching': '1456799859108479190',          // 1 on 1 coaching role
    'basic_season': '1456799883519594680',             // Seasonal Coaching 2 months
    'advanced_season': '1456799919238025358',          // Advanced Seasonal Coaching
    'vod_review': '1456799809666154584',               // (Scanning history - assumed VOD Review ID)

    // Special / New
    'fighting_1v1_single': '1471937237988937932',      // 1v1 Marius Cow role (Single Session)
    'fighting_1v1_double': '1471937237988937932',      // 1v1 Marius Cow role (Double Session)
    'fighting_1v1_all': '1471937237988937932'          // 1v1 Marius Cow role (All Modes)
};

/**
 * Assign a role to a Discord user
 */
async function assignRole(discordUserId, roleId) {
    if (!BOT_TOKEN || !GUILD_ID || !discordUserId || !roleId) {
        console.warn('Discord Bot: Missing config or IDs', { hasToken: !!BOT_TOKEN, guild: GUILD_ID, user: discordUserId, role: roleId });
        return false;
    }

    try {
        const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`;
        await axios.put(url, {}, {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Assigned role ${roleId} to user ${discordUserId}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to assign role to ${discordUserId}:`, error.response?.data || error.message);
        return false;
    }
}

/**
 * Remove a role from a Discord user
 */
async function removeRole(discordUserId, roleId) {
    try {
        const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`;
        await axios.delete(url, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });
        return true;
    } catch (error) {
        console.error(`Failed to remove role:`, error.response?.data || error.message);
        return false;
    }
}

/**
 * Sync all roles for a user based on their purchases
 */
async function syncUserRoles(uid, discordUserId) {
    console.log(`[SYNC] Starting sync for user ${uid} (Discord: ${discordUserId})`);
    try {
        const paymentsSnap = await db.collection('users').doc(uid).collection('payments').get();
        if (paymentsSnap.empty) {
            console.log(`[SYNC] No payments found for user ${uid}`);
            return true;
        }

        const purchases = paymentsSnap.docs.map(doc => ({
            id: doc.id,
            productId: doc.data().productId,
            item: doc.data().item
        }));

        console.log(`[SYNC] Found ${purchases.length} purchases.`);

        let assignedCount = 0;
        for (const purchase of purchases) {
            let roleId = null;

            // 1. Check Exact Product ID Match
            if (purchase.productId && ROLE_MAPPING[purchase.productId]) {
                roleId = ROLE_MAPPING[purchase.productId];
            }

            // 2. Check Fuzzy Item Name Match
            // If the item name contains a key concept (e.g. "VOD Review")
            if (!roleId && purchase.item) {
                const itemName = purchase.item.toLowerCase();

                // Manual overrides for known item names if they don't match IDs
                if (itemName.includes('vod review')) roleId = ROLE_MAPPING['vod_review'];
                else if (itemName.includes('1:1') || itemName.includes('coaching')) roleId = ROLE_MAPPING['single_coaching'];
                else if (itemName.includes('fighting')) roleId = ROLE_MAPPING['tO4MriPtFjmoksUbpXdQ']; // Fighting Masterclass
                else if (itemName.includes('beginner')) roleId = ROLE_MAPPING['beginner_masterclass'];
                else if (itemName.includes('intermediate')) roleId = ROLE_MAPPING['intermediate_masterclass'];
                else if (itemName.includes('advanced') && !itemName.includes('season')) roleId = ROLE_MAPPING['advanced_masterclass'];
            }

            if (roleId) {
                console.log(`[SYNC] Match found for "${purchase.item}" -> Role ${roleId}`);
                await assignRole(discordUserId, roleId);
                assignedCount++;
            } else {
                console.warn(`[SYNC] No role mapping found for item: "${purchase.item}" (ID: ${purchase.productId})`);
            }
        }
        return true;
    } catch (error) {
        console.error('Role Sync Error:', error);
        return false;
    }
}

module.exports = {
    assignRole,
    removeRole,
    syncUserRoles,
    ROLE_MAPPING
};
