const axios = require('axios');
const admin = require('./firebaseAdmin');
const db = admin.firestore();

const rawToken = process.env.DISCORD_TOKEN || '';
const BOT_TOKEN = rawToken.replace(/"/g, '').trim();
const GUILD_ID = process.env.PUBLIC_SERVER_ID || process.env.DISCORD_GUILD_ID;

const BASE_ROLE_MAPPING = {
    beginner_masterclass: '1444829030263165109',
    intermediate_masterclass: '1444829519964930088',
    advanced_masterclass: '1444829551984378027',
    tO4MriPtFjmoksUbpXdQ: '1471937065229881355',
    single_coaching: '1456799859108479190',
    basic_season: '1456799883519594680',
    advanced_season: '1456799919238025358',
    vod_review: '1456799809666154584',
    fighting_1v1_single: '1471937237988937932',
    fighting_1v1_double: '1471937237988937932',
    fighting_1v1_all: '1471937237988937932',
    // Firestore course document IDs
    bs64jytqsop75zzV5FKr: '1444829030263165109',
    YptLrG7dRXf5As19GEks: '1444829519964930088',
    P2HYKXsPngTDxPyidPzs: '1444829551984378027',
};

const ROLE_MAPPING = { ...BASE_ROLE_MAPPING };

const MANAGED_ROLE_IDS = [...new Set(Object.values(ROLE_MAPPING))];

function isPaymentActive(payment) {
    if (!payment) return false;
    if (payment.revokedAt) return false;
    if (payment.expiresAt) {
        const expiry = new Date(payment.expiresAt);
        if (!Number.isNaN(expiry.getTime()) && expiry < new Date()) return false;
    }
    return true;
}

function paymentToRoleId(payment) {
    if (!payment || !isPaymentActive(payment)) return null;

    const productId = payment.productId;
    if (productId && ROLE_MAPPING[productId]) {
        return ROLE_MAPPING[productId];
    }

    if (payment.item) {
        const itemName = String(payment.item).toLowerCase();
        if (itemName.includes('vod review')) return ROLE_MAPPING.vod_review;
        if (itemName.includes('seasonal') && itemName.includes('basic')) return ROLE_MAPPING.basic_season;
        if (itemName.includes('seasonal') && itemName.includes('advanced')) return ROLE_MAPPING.advanced_season;
        if (itemName.includes('1:1') || (itemName.includes('coaching') && !itemName.includes('seasonal') && !itemName.includes('group'))) {
            return ROLE_MAPPING.single_coaching;
        }
        if (itemName.includes('1v1') || itemName.includes('mariuscow')) return ROLE_MAPPING.fighting_1v1_single;
        if (itemName.includes('fighting')) return ROLE_MAPPING.tO4MriPtFjmoksUbpXdQ;
        if (itemName.includes('beginner')) return ROLE_MAPPING.beginner_masterclass;
        if (itemName.includes('intermediate')) return ROLE_MAPPING.intermediate_masterclass;
        if (itemName.includes('advanced') && !itemName.includes('season')) return ROLE_MAPPING.advanced_masterclass;
    }

    return null;
}

function computeDesiredRoles(payments) {
    const desired = new Set();
    for (const payment of payments) {
        const roleId = paymentToRoleId(payment);
        if (roleId) desired.add(roleId);
    }
    return desired;
}

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
                'Content-Type': 'application/json',
            },
        });
        console.log(`Assigned role ${roleId} to user ${discordUserId}`);
        return true;
    } catch (error) {
        if (error.response?.status === 404) {
            console.warn(`Discord member ${discordUserId} not in guild ${GUILD_ID}`);
            return false;
        }
        console.error(`Failed to assign role to ${discordUserId}:`, error.response?.data || error.message);
        return false;
    }
}

async function removeRole(discordUserId, roleId) {
    if (!BOT_TOKEN || !GUILD_ID || !discordUserId || !roleId) return false;

    try {
        const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`;
        await axios.delete(url, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` },
        });
        console.log(`Removed role ${roleId} from user ${discordUserId}`);
        return true;
    } catch (error) {
        if (error.response?.status === 404) return true;
        console.error(`Failed to remove role:`, error.response?.data || error.message);
        return false;
    }
}

async function reconcileDiscordRoles(discordUserId, desiredRoleIds) {
    const desired = new Set(desiredRoleIds || []);

    let memberRoleIds = [];
    try {
        const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}`;
        const res = await axios.get(url, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` },
        });
        memberRoleIds = res.data.roles || [];
    } catch (error) {
        if (error.response?.status === 404) {
            console.warn(`Cannot reconcile: member ${discordUserId} not in guild`);
            return { added: 0, removed: 0, skipped: true };
        }
        throw error;
    }

    let added = 0;
    let removed = 0;

    for (const roleId of desired) {
        if (!memberRoleIds.includes(roleId)) {
            const ok = await assignRole(discordUserId, roleId);
            if (ok) added++;
        }
    }

    for (const roleId of MANAGED_ROLE_IDS) {
        if (!desired.has(roleId) && memberRoleIds.includes(roleId)) {
            const ok = await removeRole(discordUserId, roleId);
            if (ok) removed++;
        }
    }

    return { added, removed, skipped: false };
}

async function reconcileUserByUid(uid, options = {}) {
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) return { skipped: true, reason: 'user_not_found' };

    const userData = userSnap.data();
    const discordUserId = userData.discordId;
    if (!discordUserId) return { skipped: true, reason: 'not_linked' };

    let payments = [];
    if (!options.stripAll) {
        const paymentsSnap = await db.collection('users').doc(uid).collection('payments').get();
        payments = paymentsSnap.docs.map((doc) => doc.data());
    }

    const desired = computeDesiredRoles(payments);
    const result = await reconcileDiscordRoles(discordUserId, [...desired]);
    console.log(`[SYNC] uid=${uid} discord=${discordUserId} desired=${desired.size} added=${result.added} removed=${result.removed}`);
    return result;
}

async function syncUserRoles(uid, discordUserId) {
    console.log(`[SYNC] Starting sync for user ${uid} (Discord: ${discordUserId})`);
    if (!discordUserId) return false;
    try {
        const paymentsSnap = await db.collection('users').doc(uid).collection('payments').get();
        const payments = paymentsSnap.docs.map((doc) => doc.data());
        const desired = computeDesiredRoles(payments);
        await reconcileDiscordRoles(discordUserId, [...desired]);
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
    reconcileUserByUid,
    reconcileDiscordRoles,
    computeDesiredRoles,
    paymentToRoleId,
    isPaymentActive,
    ROLE_MAPPING,
    MANAGED_ROLE_IDS,
    BOT_TOKEN,
    GUILD_ID,
};
