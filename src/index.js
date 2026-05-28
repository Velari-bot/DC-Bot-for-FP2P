const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { isPaymentActive } = require('../shared/discordBot');
const { getUserContext } = require('./lib/userContext');
const { memberHandlers, getSiteUrl } = require('./commands/member');
const { adminHandlers } = require('./commands/admin');
const { getCommandDefinitions } = require('./commands/definitions');
const { startScheduler } = require('./scheduler');

const TOKEN = (process.env.DISCORD_TOKEN || '').replace(/"/g, '').trim();
const CLIENT_ID = (process.env.DISCORD_CLIENT_ID || process.env.DISCORD_APPLICATION_ID || '').replace(/"/g, '').trim();
const GUILD_ID = (process.env.PUBLIC_SERVER_ID || process.env.DISCORD_GUILD_ID || '').replace(/"/g, '').trim();

if (!TOKEN) {
    console.error('DISCORD_TOKEN is required');
    process.exit(1);
}

// Server Members Intent must be ON in Developer Portal → Bot, or Discord closes the socket ("Used disallowed intents").
// Set DISCORD_DISABLE_GUILD_MEMBERS_INTENT=1 only for local smoke tests — welcome DMs (guildMemberAdd) will not run.
const useGuildMembersIntent = process.env.DISCORD_DISABLE_GUILD_MEMBERS_INTENT !== '1';
const gatewayIntents = [GatewayIntentBits.Guilds];
if (useGuildMembersIntent) {
    gatewayIntents.push(GatewayIntentBits.GuildMembers);
} else {
    console.warn(
        '[Bot] GuildMembers intent disabled (DISCORD_DISABLE_GUILD_MEMBERS_INTENT=1). Enable Server Members Intent in the Developer Portal and remove this env for welcome DMs.'
    );
}

const client = new Client({
    intents: gatewayIntents,
});

function startHealthServer() {
    const port = process.env.PORT || 8080;
    http.createServer((req, res) => {
        const ready = client.isReady();
        res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: ready, service: 'discord-bot' }));
    }).listen(port, () => {
        console.log(`Health check listening on :${port}`);
    });
}

client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
    startScheduler(client);
});

if (useGuildMembersIntent) {
    client.on('guildMemberAdd', async (member) => {
        if (member.guild.id !== GUILD_ID) return;
        try {
            const ctx = await getUserContext(member.id);
            if (!ctx) return;

            const hasActive = ctx.payments.some(isPaymentActive);
            if (!hasActive) return;

            await member.send(
                `Welcome to the server! Your website account is linked.\n` +
                    `Manage courses and subscriptions: ${getSiteUrl()}/claim\n` +
                    `Run **/sync** here if your roles are missing.`
            ).catch(() => {});
        } catch (err) {
            console.warn('Welcome DM failed:', err.message);
        }
    });
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const name = interaction.commandName;
    try {
        if (memberHandlers[name]) {
            return memberHandlers[name](interaction);
        }
        if (adminHandlers[name]) {
            return adminHandlers[name](interaction);
        }
    } catch (err) {
        console.error(`Command ${name} error:`, err);
        const msg = { ephemeral: true, content: 'Something went wrong. Try again later.' };
        if (interaction.deferred || interaction.replied) {
            return interaction.editReply(msg.content);
        }
        return interaction.reply(msg);
    }
});

async function registerGuildCommands() {
    if (!CLIENT_ID || !GUILD_ID) {
        console.warn('Skip command registration: set DISCORD_CLIENT_ID and PUBLIC_SERVER_ID');
        return;
    }
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: getCommandDefinitions(),
    });
    console.log('Guild slash commands registered');
}

if (process.env.DISCORD_SKIP_GUILD_COMMAND_REGISTER_ON_START === '1') {
    console.info('Skipping guild slash command registration on startup (DISCORD_SKIP_GUILD_COMMAND_REGISTER_ON_START=1). Use npm run discord:register or discord:register-global if needed.');
} else {
    registerGuildCommands().catch((err) => {
        const code = err.code != null ? ` (Discord code ${err.code})` : '';
        console.warn(`Guild command registration failed on startup:${code}`, err.message);
        console.warn(
            'Fix: invite the bot to the server in PUBLIC_SERVER_ID (npm run discord:invite), or register commands globally: npm run discord:register-global'
        );
    });
}

startHealthServer();
client.login(TOKEN);
