const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const admin = require('../shared/firebaseAdmin');
const { isPaymentActive } = require('../shared/discordBot');
const { getUserContext } = require('./lib/userContext');
const { memberHandlers, getSiteUrl } = require('./commands/member');
const { adminHandlers } = require('./commands/admin');
const { getCommandDefinitions } = require('./commands/definitions');
const { startScheduler } = require('./scheduler');
const {
    normalizeDiscordToken,
    normalizeDiscordId,
    validateDiscordToken,
} = require('../shared/discordEnv');

const TOKEN = normalizeDiscordToken(process.env.DISCORD_TOKEN);
const CLIENT_ID = normalizeDiscordId(
    process.env.DISCORD_CLIENT_ID || process.env.DISCORD_APPLICATION_ID
);
const GUILD_ID = normalizeDiscordId(
    process.env.PUBLIC_SERVER_ID || process.env.DISCORD_GUILD_ID
);
const db = admin.firestore();
const VOD_REPLAY_CHANNEL_ID = normalizeDiscordId(process.env.DISCORD_VOD_REPLAY_CHANNEL_ID || '');

const tokenCheck = validateDiscordToken(TOKEN);
if (!tokenCheck.ok) {
    console.error(`[Bot] ${tokenCheck.reason}`);
    console.error(
        'Railway → Variables → DISCORD_TOKEN: Discord Developer Portal → Your App → Bot → Reset Token → copy token (no quotes).'
    );
}

let discordStatus = tokenCheck.ok ? 'connecting' : 'misconfigured';
let discordLoginError = tokenCheck.ok ? null : tokenCheck.reason;

const useGuildMembersIntent = process.env.DISCORD_DISABLE_GUILD_MEMBERS_INTENT !== '1';
const gatewayIntents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions];
if (useGuildMembersIntent) {
    gatewayIntents.push(GatewayIntentBits.GuildMembers);
} else {
    console.warn(
        '[Bot] GuildMembers intent disabled (DISCORD_DISABLE_GUILD_MEMBERS_INTENT=1). Enable Server Members Intent in the Developer Portal and remove this env for welcome DMs.'
    );
}

const client = new Client({
    intents: gatewayIntents,
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const VOD_REACTION_STATUS = {
    '👀': 'in_review',
    '✅': 'reviewed',
    '⏭️': 'skipped',
    '⏭': 'skipped',
};

function vodStatusUpdate(status, userId) {
    const now = new Date().toISOString();
    const update = {
        status,
        statusUpdatedAt: now,
        discordReactedBy: userId,
    };
    if (status === 'in_review') {
        update.pickedAt = now;
        update.pickedBy = `discord:${userId}`;
        update.featured = true;
    }
    if (status === 'reviewed') {
        update.reviewedAt = now;
        update.reviewedBy = `discord:${userId}`;
    }
    if (status === 'skipped') {
        update.skippedAt = now;
        update.skippedBy = `discord:${userId}`;
        update.skippedReason = 'Skipped from Discord reaction';
    }
    return update;
}

async function findVodSubmissionByMessage(message) {
    const messageId = message?.id;
    if (!messageId) return null;

    const snap = await db.collection('vod_submissions')
        .where('discordMessageId', '==', messageId)
        .limit(1)
        .get();
    if (!snap.empty) return snap.docs[0];

    const footerText = message.embeds?.[0]?.footer?.text || '';
    const match = footerText.match(/vod:([A-Za-z0-9_-]+)/);
    if (!match) return null;
    const doc = await db.collection('vod_submissions').doc(match[1]).get();
    return doc.exists ? doc : null;
}

async function notifyVodUserReviewed(client, submission) {
    const data = submission.data();
    if (!data?.uid) return;
    const userDoc = await db.collection('users').doc(data.uid).get();
    const discordId = userDoc.exists ? userDoc.data()?.discordId : null;
    if (!discordId) return;

    const user = await client.users.fetch(discordId).catch(() => null);
    if (!user) return;

    await user.send(
        `Your replay **${data.replayCode || data.title || 'submission'}** was marked reviewed by Deckzee.\n` +
        `Check your VOD history: ${getSiteUrl()}/claim`
    ).catch(() => {});
}

function startHealthServer() {
    const port = process.env.PORT || 8080;
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ok: true,
            discord: client.isReady() ? 'ready' : discordStatus,
            service: 'discord-bot',
            ...(discordLoginError ? { error: String(discordLoginError).slice(0, 200) } : {}),
        }));
    }).listen(port, () => {
        console.log(`Health check listening on :${port}`);
    });
}

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

client.once('ready', async () => {
    discordStatus = 'ready';
    discordLoginError = null;
    console.log(`Discord bot logged in as ${client.user.tag}`);

    if (process.env.DISCORD_SKIP_GUILD_COMMAND_REGISTER_ON_START !== '1') {
        try {
            await registerGuildCommands();
        } catch (err) {
            const code = err.code != null ? ` (Discord code ${err.code})` : '';
            console.warn(`Guild command registration failed on startup:${code}`, err.message);
            console.warn(
                'Fix: invite the bot to the server in PUBLIC_SERVER_ID (npm run discord:invite), or register commands globally: npm run discord:register-global'
            );
        }
    }

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

client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (user.bot) return;
        const emoji = reaction.emoji?.name;
        const status = VOD_REACTION_STATUS[emoji];
        if (!status) return;

        if (reaction.partial) reaction = await reaction.fetch();
        const message = reaction.message?.partial ? await reaction.message.fetch() : reaction.message;
        if (!message?.id) return;
        if (VOD_REPLAY_CHANNEL_ID && message.channelId !== VOD_REPLAY_CHANNEL_ID) return;

        const submission = await findVodSubmissionByMessage(message);
        if (!submission) return;

        await submission.ref.set(vodStatusUpdate(status, user.id), { merge: true });
        console.log(`[VOD] ${submission.id} -> ${status} via ${emoji} by ${user.id}`);

        if (status === 'reviewed') {
            await notifyVodUserReviewed(client, submission);
        }
    } catch (err) {
        console.warn('[VOD] reaction status update failed:', err.message);
    }
});

if (process.env.DISCORD_SKIP_GUILD_COMMAND_REGISTER_ON_START === '1') {
    console.info(
        'Skipping guild slash command registration on startup (DISCORD_SKIP_GUILD_COMMAND_REGISTER_ON_START=1).'
    );
}

startHealthServer();

if (tokenCheck.ok) {
    client.login(TOKEN).catch((err) => {
        discordStatus = 'login_failed';
        discordLoginError = err.message;
        console.error('[Bot] Discord login failed:', err.message);
        if (err.code === 'TokenInvalid') {
            console.error(
                'DISCORD_TOKEN is invalid or was reset. Railway → Variables → paste a fresh Bot token from Developer Portal (Bot tab, not Client Secret). No quotes.'
            );
        }
    });
} else {
    console.error('[Bot] Skipping client.login() until DISCORD_TOKEN is fixed.');
}
