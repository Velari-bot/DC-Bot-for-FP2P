/**
 * Normalize and validate Discord env vars (Railway often adds stray quotes).
 */

function stripEnvQuotes(value) {
    if (!value || typeof value !== 'string') return '';
    let v = value.trim();
    while (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
    ) {
        v = v.slice(1, -1).trim();
    }
    return v;
}

function normalizeDiscordToken(raw) {
    let token = stripEnvQuotes(raw || '');
    if (token.toLowerCase().startsWith('bot ')) {
        token = token.slice(4).trim();
    }
    return token;
}

function normalizeDiscordId(raw) {
    return stripEnvQuotes(raw || '');
}

/**
 * Bot tokens are three dot-separated segments from Developer Portal → Bot → Token.
 */
function validateDiscordToken(token) {
    if (!token) {
        return { ok: false, reason: 'DISCORD_TOKEN is empty' };
    }
    if (/your[_-]?bot|placeholder|changeme|xxx{3,}/i.test(token)) {
        return { ok: false, reason: 'DISCORD_TOKEN looks like a placeholder — paste the real Bot token' };
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
        return {
            ok: false,
            reason: 'DISCORD_TOKEN must be the Bot token (three parts separated by dots), not the Client Secret',
        };
    }
    if (parts.some((p) => !p || p.length < 4)) {
        return { ok: false, reason: 'DISCORD_TOKEN format is invalid — reset token in Discord Developer Portal' };
    }
    return { ok: true };
}

module.exports = {
    stripEnvQuotes,
    normalizeDiscordToken,
    normalizeDiscordId,
    validateDiscordToken,
};
