const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { REST, Routes } = require('discord.js');
const { getCommandDefinitions } = require('../src/commands/definitions');

const TOKEN = (process.env.DISCORD_TOKEN || '').replace(/"/g, '').trim();
const CLIENT_ID = (process.env.DISCORD_CLIENT_ID || process.env.DISCORD_APPLICATION_ID || '').replace(/"/g, '').trim();
const GUILD_ID = (process.env.PUBLIC_SERVER_ID || process.env.DISCORD_GUILD_ID || '').replace(/"/g, '').trim();

const useGlobal =
    process.argv.includes('--global') ||
    process.env.DISCORD_REGISTER_GLOBAL === '1' ||
    process.env.DISCORD_REGISTER_GLOBAL === 'true';

const API = 'https://discord.com/api/v10';

async function discordApi(method, route, body) {
    const opts = {
        method,
        signal: AbortSignal.timeout(15000),
        headers: {
            Authorization: `Bot ${TOKEN}`,
            'Content-Type': 'application/json',
        },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${route}`, opts);
    const text = await res.text();
    let json;
    try {
        json = text ? JSON.parse(text) : {};
    } catch {
        json = { raw: text };
    }
    if (!res.ok) {
        const err = new Error(json.message || res.statusText || 'Discord API error');
        err.status = res.status;
        err.code = json.code;
        err.body = json;
        throw err;
    }
    return json;
}

function print50001Help() {
    console.error(`
Discord returned 50001 (Missing Access) when registering GUILD slash commands.

Fix (pick one path):

1) Bot must be IN the server, and PUBLIC_SERVER_ID must be that server's ID.
   - Run: npm run discord:invite
   - Open the URL, choose the correct server, authorize.
   - Re-invite if you ever used an old URL without "applications.commands".

2) DISCORD_CLIENT_ID must be the SAME application as the bot behind DISCORD_TOKEN.
   - Developer Portal → Application → "Application ID" = DISCORD_CLIENT_ID
   - Bot tab → token belongs to that same application.

3) Register globally (no guild needed; commands can take ~1 hour to show everywhere):
   npm run discord:register -- --global
   Or set DISCORD_REGISTER_GLOBAL=1 in .env
`);
}

async function main() {
    if (!TOKEN || !CLIENT_ID) {
        console.error('Required: DISCORD_TOKEN, DISCORD_CLIENT_ID');
        process.exit(1);
    }
    if (!useGlobal && !GUILD_ID) {
        console.error('Required for guild commands: PUBLIC_SERVER_ID (or DISCORD_GUILD_ID)');
        console.error('Or use: npm run discord:register -- --global');
        process.exit(1);
    }

    let appIdFromToken;
    try {
        const me = await discordApi('GET', '/oauth2/applications/@me');
        appIdFromToken = me.id;
        console.log(`Token OK — application "${me.name}" (${me.id})`);
    } catch (e) {
        console.error('Invalid DISCORD_TOKEN (could not read application @me):', e.message);
        process.exit(1);
    }

    if (CLIENT_ID !== appIdFromToken) {
        console.error(
            `Mismatch: DISCORD_CLIENT_ID=${CLIENT_ID} but this bot token belongs to application id ${appIdFromToken}.`
        );
        console.error('Set DISCORD_CLIENT_ID to the application id that owns this bot token.');
        process.exit(1);
    }

    if (!useGlobal) {
        try {
            const guild = await discordApi('GET', `/guilds/${GUILD_ID}`);
            console.log(`Guild OK — bot sees server "${guild.name}" (${guild.id})`);
        } catch (e) {
            console.error(
                `Cannot access guild ${GUILD_ID}: ${e.message} (HTTP ${e.status}). The bot is probably not in this server, or PUBLIC_SERVER_ID is wrong.`
            );
            console.error('Try: npm run discord:invite  then re-run this script.');
            console.error('Or register globally: npm run discord:register -- --global');
            process.exit(1);
        }
    }

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    const body = getCommandDefinitions();

    try {
        if (useGlobal) {
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
            console.log('Successfully registered GLOBAL commands (may take up to ~1 hour to appear in all servers).');
        } else {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
            console.log('Successfully registered GUILD commands (instant in that server).');
        }
    } catch (err) {
        if (err.code === 50001) {
            print50001Help();
        } else {
            console.error(err);
        }
        process.exit(1);
    }
}

main();
