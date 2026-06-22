const { reconcileUserByUid } = require('../../shared/discordBot');
const {
    maskEmail,
    getActiveEntitlements,
    getActiveRoleLabels,
} = require('../../shared/discordMemberHelpers');
const { getUserContext, findUidByDiscordId } = require('../lib/userContext');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getSiteUrl() {
    const url = (process.env.SITE_URL || '').trim();
    if (url) return url.replace(/\/$/, '');
    if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
    return 'https://www.fortnitepathtopro.com';
}

function getClaimUrl(connectTarget = '') {
    const base = `${getSiteUrl()}/claim`;
    if (!connectTarget) return base;
    return `${base}?connect=${encodeURIComponent(connectTarget)}`;
}

async function handleSync(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const uid = await findUidByDiscordId(interaction.user.id);
    if (!uid) {
        return interaction.editReply(
            `Not linked. Connect your Discord account here: ${getClaimUrl('discord')}\nThen run /sync again.`
        );
    }
    const result = await reconcileUserByUid(uid);
    if (result.skipped) {
        return interaction.editReply('Could not sync roles. Try linking again on the website.');
    }
    return interaction.editReply(`Roles synced. Added: ${result.added}, removed: ${result.removed}.`);
}

async function handleStatus(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const ctx = await getUserContext(interaction.user.id);
    if (!ctx) {
        return interaction.editReply(`Not linked. Connect Discord here: ${getClaimUrl('discord')}`);
    }

    const { userData, payments } = ctx;
    const active = getActiveEntitlements(payments);
    const roles = getActiveRoleLabels(payments);
    const lines = [
        `**Account:** ${maskEmail(userData.email)}`,
        `**Linked:** ${userData.discordLinkedAt ? new Date(userData.discordLinkedAt).toLocaleDateString() : 'Unknown'}`,
        `**Coaching credits:** ${userData.credits ?? 0} hour(s)`,
    ];

    if (userData.securityStrikes) {
        lines.push(`**Security strikes:** ${userData.securityStrikes}/3`);
    }
    if (userData.accessRevoked) {
        lines.push('**Access:** Revoked (security violations)');
    }
    if (userData.banned) {
        lines.push('**Account:** Banned on website');
    }

    lines.push(`**Discord roles (from active subs):** ${roles.length ? roles.join(', ') : 'None'}`);
    lines.push(`**Active entitlements:** ${active.length}`);

    return interaction.editReply(lines.join('\n'));
}

async function handleSubscriptions(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const ctx = await getUserContext(interaction.user.id);
    if (!ctx) {
        return interaction.editReply(`Not linked. Connect Discord here first: ${getClaimUrl('discord')}`);
    }

    const active = getActiveEntitlements(ctx.payments);
    if (!active.length) {
        return interaction.editReply('No active subscriptions or purchases on your account.');
    }

    const lines = active.map((e, i) => `${i + 1}. **${e.label}** — expires: ${e.expires}`);
    return interaction.editReply(`**Your active access:**\n${lines.join('\n')}`);
}

async function handleCredits(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const ctx = await getUserContext(interaction.user.id);
    if (!ctx) {
        return interaction.editReply(`Not linked. Connect Discord here first: ${getClaimUrl('discord')}`);
    }
    const credits = ctx.userData.credits ?? 0;
    return interaction.editReply(
        `You have **${credits}** coaching credit(s) (1 credit = 1 hour of 1:1 coaching).\nBook or manage access at ${getClaimUrl()}`
    );
}

async function handleLink(interaction) {
    return handleConnections(interaction);
}

async function handleConnections(interaction) {
    const ctx = await getUserContext(interaction.user.id);
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Connect Discord').setStyle(ButtonStyle.Link).setURL(getClaimUrl('discord')),
        new ButtonBuilder().setLabel('Connect Epic Games').setStyle(ButtonStyle.Link).setURL(getClaimUrl('epic'))
    );
    const status = ctx ? [
        '**Website account:** Connected',
        '**Discord:** Connected',
        `**Epic Games:** ${ctx.userData.epicDisplayName ? `Connected as ${ctx.userData.epicDisplayName}` : 'Not connected'}`,
    ] : [
        '**Website account:** Not connected',
        'Sign in on the website, then use the buttons below.',
    ];
    return interaction.reply({
        ephemeral: true,
        content: `**Account Connections**\n${status.join('\n')}\n\nDiscord link: ${getClaimUrl('discord')}\nEpic Games link: ${getClaimUrl('epic')}\n\nAfter connecting Discord, run **/sync** to apply your roles.`,
        components: [row],
    });
}

async function handleSupport(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const ctx = await getUserContext(interaction.user.id);
    const lines = [
        `**Claim / Dashboard:** ${getClaimUrl()}`,
        `**Link Discord:** ${getClaimUrl('discord')}`,
        `**Link Epic Games:** ${getClaimUrl('epic')}`,
        '**Roles wrong?** Run `/sync` or re-link on the website',
        '**Billing / cancel sub:** Use the billing portal on the claim page (Stripe)',
        '**Courses:** Open your masterclass from the website after purchase',
    ];
    if (!ctx) {
        lines.unshift('You are not linked yet — start at the claim page.');
    }
    return interaction.editReply(lines.join('\n'));
}

async function handleLive(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const admin = require('../../shared/firebaseAdmin');
        const doc = await admin.firestore().collection('site_settings').doc('live').get();
        const data = doc.exists ? doc.data() : { isLive: false };
        if (!data.isLive) {
            return interaction.editReply(`Deckzee is not live right now. Check ${getSiteUrl()} for updates.`);
        }
        const url = data.streamUrl ? `\n**Watch:** ${data.streamUrl}` : '';
        return interaction.editReply(`**${data.title || 'Deckzee is live'}** (${data.platform || 'stream'})${url}`);
    } catch (e) {
        return interaction.editReply('Could not fetch live status.');
    }
}

const memberHandlers = {
    sync: handleSync,
    status: handleStatus,
    subscriptions: handleSubscriptions,
    credits: handleCredits,
    link: handleLink,
    connections: handleConnections,
    support: handleSupport,
    live: handleLive,
};

module.exports = { memberHandlers, getSiteUrl };
