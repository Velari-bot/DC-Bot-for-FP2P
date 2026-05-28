const axios = require('axios');

function getPurchaseWebhookUrl() {
    return (
        process.env.DISCORD_PURCHASE_WEBHOOK_URL ||
        process.env.DISCORD_WEBHOOK_URL ||
        ''
    ).replace(/"/g, '').trim();
}

async function postToWebhook(url, payload) {
    if (!url) return false;
    try {
        await axios.post(url.replace(/"/g, '').trim(), payload);
        return true;
    } catch (err) {
        console.error('Discord webhook error:', err.message);
        return false;
    }
}

async function postDiscordWebhook(payload) {
    const url = getPurchaseWebhookUrl();
    if (!url) {
        console.warn('Discord notification skipped: DISCORD_PURCHASE_WEBHOOK_URL not set');
        return false;
    }
    return postToWebhook(url, payload);
}

function getAuditWebhookUrl() {
    return (process.env.DISCORD_AUDIT_WEBHOOK_URL || '').replace(/"/g, '').trim();
}

async function notifyAuditReport({ mismatchCount, preview }) {
    const auditWebhook = getAuditWebhookUrl();
    const payload = {
        embeds: [{
            title: 'Role mismatch audit',
            description: `Found **${mismatchCount}** leaked role(s) (Discord role without active website sub).`,
            color: 0xffaa00,
            fields: preview ? [{ name: 'Sample', value: preview.slice(0, 1000) }] : [],
            timestamp: new Date().toISOString(),
        }],
    };
    if (auditWebhook) return postToWebhook(auditWebhook, payload);
    return postDiscordWebhook(payload);
}

async function notifyPurchase({ email, productName, amount }) {
    return postDiscordWebhook({
        embeds: [{
            title: 'New Purchase',
            description: `**${email}** bought **${productName}**`,
            color: 0xfacc24,
            fields: [{ name: 'Amount', value: `$${amount}`, inline: true }],
            timestamp: new Date().toISOString(),
        }],
    });
}

async function notifyAccessRevoked({ email, eventType }) {
    return postDiscordWebhook({
        embeds: [{
            title: 'Access Revoked',
            description: `**${email}** lost access (${eventType})`,
            color: 0xff0000,
            timestamp: new Date().toISOString(),
        }],
    });
}

function getLiveWebhookUrl() {
    return (
        process.env.DISCORD_LIVE_WEBHOOK_URL ||
        process.env.DISCORD_PURCHASE_WEBHOOK_URL ||
        process.env.DISCORD_WEBHOOK_URL ||
        ''
    ).replace(/"/g, '').trim();
}

async function notifyLiveStarted({ title, streamUrl, platform }) {
    const url = getLiveWebhookUrl();
    if (!url) return false;
    const fields = [];
    if (platform) fields.push({ name: 'Platform', value: platform, inline: true });
    if (streamUrl) fields.push({ name: 'Watch', value: streamUrl });
    return postToWebhook(url, {
        content: '@everyone',
        embeds: [{
            title: 'Deckzee is LIVE',
            description: title || 'Stream started',
            color: 0x5865f2,
            fields,
            timestamp: new Date().toISOString(),
        }],
    });
}

async function notifyLiveEnded() {
    const url = getLiveWebhookUrl();
    if (!url) return false;
    return postToWebhook(url, {
        embeds: [{
            title: 'Stream ended',
            description: 'Thanks for watching — catch the VOD on the site when it is up.',
            color: 0x808080,
            timestamp: new Date().toISOString(),
        }],
    });
}

async function notifySecurityRevoked({ email, uid, strikes }) {
    const modWebhook = process.env.DISCORD_MOD_WEBHOOK_URL || getPurchaseWebhookUrl();
    if (!modWebhook) return false;
    try {
        await axios.post(modWebhook, {
            embeds: [{
                title: 'Security: Access Revoked',
                description: `**${email}** reached **${strikes}/3** strikes. Course access revoked.`,
                color: 0xff6600,
                fields: [{ name: 'UID', value: uid, inline: true }],
                timestamp: new Date().toISOString(),
            }],
        });
        return true;
    } catch (err) {
        console.error('Security Discord notify error:', err.message);
        return false;
    }
}

module.exports = {
    notifyPurchase,
    notifyAccessRevoked,
    notifySecurityRevoked,
    notifyAuditReport,
    notifyLiveStarted,
    notifyLiveEnded,
    postDiscordWebhook,
    postToWebhook,
    getAuditWebhookUrl,
    getLiveWebhookUrl,
};
