const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const axios = require('axios');
const admin = require('../shared/firebaseAdmin');
const { reconcileUserByUid, MANAGED_ROLE_IDS, computeDesiredRoles, BOT_TOKEN, GUILD_ID } = require('../shared/discordBot');
const { notifyAuditReport } = require('../shared/discordNotifications');

const db = admin.firestore();
const INTERVAL_MS = parseInt(process.env.DISCORD_SYNC_INTERVAL_MS || '1800000', 10);
const AUDIT_INTERVAL_MS = parseInt(process.env.DISCORD_AUDIT_INTERVAL_MS || '604800000', 10); // 7 days
const BATCH_DELAY_MS = parseInt(process.env.DISCORD_SYNC_BATCH_DELAY_MS || '500', 10);

let lastAuditRun = 0;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reconcileAllLinkedUsers() {
    if (!admin.apps.length) {
        console.error('[Scheduler] Firebase Admin not initialized');
        return;
    }

    const snap = await db.collection('users').where('discordId', '>', '').get();
    console.log(`[Scheduler] Reconciling ${snap.size} linked users`);

    let ok = 0;
    let fail = 0;

    for (const doc of snap.docs) {
        try {
            const result = await reconcileUserByUid(doc.id);
            if (result.skipped) fail++;
            else ok++;
        } catch (err) {
            fail++;
            console.error(`[Scheduler] Failed uid=${doc.id}:`, err.message);
        }
        await sleep(BATCH_DELAY_MS);
    }

    console.log(`[Scheduler] Done. ok=${ok} skipped/fail=${fail}`);
}

async function runRoleMismatchAudit(client) {
    if (!BOT_TOKEN || !GUILD_ID || !client?.isReady?.()) return;

    const now = Date.now();
    if (now - lastAuditRun < AUDIT_INTERVAL_MS) return;
    lastAuditRun = now;

    console.log('[Audit] Starting role mismatch audit');

    const linkedSnap = await db.collection('users').where('discordId', '>', '').get();
    const mismatches = [];

    for (const doc of linkedSnap.docs) {
        const data = doc.data();
        const discordId = data.discordId;
        const paymentsSnap = await doc.ref.collection('payments').get();
        const payments = paymentsSnap.docs.map((d) => d.data());
        const desired = computeDesiredRoles(payments);

        try {
            const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`;
            const res = await axios.get(url, {
                headers: { Authorization: `Bot ${BOT_TOKEN}` },
            });
            const memberRoles = res.data.roles || [];

            for (const roleId of MANAGED_ROLE_IDS) {
                const hasRole = memberRoles.includes(roleId);
                const shouldHave = desired.has(roleId);
                if (hasRole && !shouldHave) {
                    mismatches.push({
                        email: data.email || doc.id,
                        discordId,
                        roleId,
                        issue: 'leaked_role',
                    });
                }
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                console.warn(`[Audit] member ${discordId}:`, err.message);
            }
        }
        await sleep(200);
    }

    if (mismatches.length === 0) {
        console.log('[Audit] No role mismatches found');
        return;
    }

    console.log(`[Audit] Found ${mismatches.length} leaked role(s)`);

    const preview = mismatches
        .slice(0, 10)
        .map((m) => `• ${m.email}: leaked role ${m.roleId}`)
        .join('\n');

    await notifyAuditReport({
        mismatchCount: mismatches.length,
        preview: `${preview}${mismatches.length > 10 ? '\n…' : ''}`,
    });

    const channelId = (process.env.DISCORD_AUDIT_CHANNEL_ID || '').replace(/"/g, '').trim();
    if (channelId && client) {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (channel?.isTextBased()) {
            await channel.send({
                content: `**Role mismatch audit** — ${mismatches.length} issue(s)\n${preview}${mismatches.length > 10 ? '\n…' : ''}`,
            }).catch(() => {});
        }
    }
}

function startScheduler(client) {
    reconcileAllLinkedUsers().catch(console.error);
    setInterval(() => {
        reconcileAllLinkedUsers().catch(console.error);
    }, INTERVAL_MS);

    if (client) {
        setInterval(() => {
            runRoleMismatchAudit(client).catch(console.error);
        }, Math.min(AUDIT_INTERVAL_MS, INTERVAL_MS));
    }

    console.log(`[Scheduler] Started (sync every ${INTERVAL_MS / 60000} min)`);
}

module.exports = { reconcileAllLinkedUsers, runRoleMismatchAudit, startScheduler };
