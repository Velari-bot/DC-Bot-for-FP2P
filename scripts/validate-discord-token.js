#!/usr/bin/env node
/**
 * Verify DISCORD_TOKEN shape and optionally call Discord GET /users/@me
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const { normalizeDiscordToken, validateDiscordToken } = require('../shared/discordEnv');

const token = normalizeDiscordToken(process.env.DISCORD_TOKEN);
const check = validateDiscordToken(token);

if (!check.ok) {
    console.error('FAIL:', check.reason);
    process.exit(1);
}

console.log('Token format: OK (3 segments)');
console.log(`Prefix: ${token.slice(0, 8)}...`);

axios
    .get('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bot ${token}` },
    })
    .then((res) => {
        console.log(`Discord API: OK — bot user ${res.data.username}#${res.data.discriminator || '0'} (${res.data.id})`);
        process.exit(0);
    })
    .catch((err) => {
        const status = err.response?.status;
        const body = err.response?.data;
        console.error('Discord API: FAIL', status || err.message, body?.message || '');
        if (status === 401) {
            console.error('Reset the token in Developer Portal → Bot → Reset Token, then update Railway DISCORD_TOKEN.');
        }
        process.exit(1);
    });
