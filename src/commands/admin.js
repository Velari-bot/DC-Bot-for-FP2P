const { isDiscordAdmin, lookupByEmail, grantAccess, banUser, unbanUser, getLinkedUserByDiscordId } = require('../../shared/discordAdminActions');
const { reconcileUserByUid, isPaymentActive } = require('../../shared/discordBot');
const { COURSE_CHOICES } = require('./courseChoices');

async function requireAdmin(interaction) {
    const member = interaction.member;
    const roles = member?.roles?.cache ? [...member.roles.cache.keys()] : [];
    const ok = await isDiscordAdmin(interaction.user.id, roles);
    if (!ok) {
        await interaction.reply({ ephemeral: true, content: 'You do not have permission to use admin commands.' });
        return false;
    }
    return true;
}

async function handleAdminLookup(interaction) {
    if (!(await requireAdmin(interaction))) return;
    await interaction.deferReply({ ephemeral: true });

    const email = interaction.options.getString('email', true);
    try {
        const { uid, userData, payments, userRecord } = await lookupByEmail(email);
        const activeCount = payments.filter(isPaymentActive).length;
        const lines = [
            `**UID:** ${uid}`,
            `**Email:** ${email}`,
            `**Banned:** ${userData.banned ? 'Yes' : 'No'}`,
            `**Discord ID:** ${userData.discordId || 'Not linked'}`,
            `**Strikes:** ${userData.securityStrikes || 0}/3`,
            `**Access revoked:** ${userData.accessRevoked ? 'Yes' : 'No'}`,
            `**Credits:** ${userData.credits ?? 0}`,
            `**Payments:** ${payments.length} total, ${activeCount} active`,
            `**Auth disabled:** ${userRecord.disabled ? 'Yes' : 'No'}`,
        ];
        return interaction.editReply(lines.join('\n'));
    } catch (err) {
        return interaction.editReply(`Lookup failed: ${err.message}`);
    }
}

async function handleAdminSync(interaction) {
    if (!(await requireAdmin(interaction))) return;
    await interaction.deferReply({ ephemeral: true });

    const email = interaction.options.getString('email', true);
    try {
        const { uid, userData } = await lookupByEmail(email);
        if (!userData.discordId) {
            return interaction.editReply('User has no Discord linked.');
        }
        const result = await reconcileUserByUid(uid);
        return interaction.editReply(
            `Synced ${email}. Added: ${result.added}, removed: ${result.removed}.`
        );
    } catch (err) {
        return interaction.editReply(`Sync failed: ${err.message}`);
    }
}

async function handleAdminGrant(interaction) {
    if (!(await requireAdmin(interaction))) return;
    await interaction.deferReply({ ephemeral: true });

    const email = interaction.options.getString('email', true);
    const courseId = interaction.options.getString('course', true);
    const duration = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || 'Discord admin grant';

    const durationMap = {
        '7d': { value: 7, unit: 'days' },
        '30d': { value: 30, unit: 'days' },
        '90d': { value: 90, unit: 'days' },
        '1y': { value: 1, unit: 'years' },
        forever: { value: 0, unit: 'forever' },
    };
    const d = durationMap[duration] || durationMap['30d'];

    const linked = await getLinkedUserByDiscordId(interaction.user.id);
    const adminEmail = linked?.data?.email || 'discord-admin';

    try {
        const { courseTitle, expiresAt } = await grantAccess({
            targetEmail: email,
            courseId,
            durationValue: d.value,
            durationUnit: d.unit,
            reason,
            adminEmail,
        });
        return interaction.editReply(
            `Granted **${courseTitle}** to ${email}.${expiresAt ? ` Expires: ${new Date(expiresAt).toLocaleDateString()}` : ' (no expiry)'}`
        );
    } catch (err) {
        return interaction.editReply(`Grant failed: ${err.message}`);
    }
}

async function handleAdminBan(interaction) {
    if (!(await requireAdmin(interaction))) return;
    await interaction.deferReply({ ephemeral: true });

    const email = interaction.options.getString('email', true);
    const reason = interaction.options.getString('reason') || 'Banned via Discord admin';

    try {
        await banUser({ targetEmail: email, reason });
        return interaction.editReply(`Banned **${email}** and revoked access.`);
    } catch (err) {
        return interaction.editReply(`Ban failed: ${err.message}`);
    }
}

async function handleAdminUnban(interaction) {
    if (!(await requireAdmin(interaction))) return;
    await interaction.deferReply({ ephemeral: true });

    const email = interaction.options.getString('email', true);

    try {
        await unbanUser({ targetEmail: email });
        return interaction.editReply(`Unbanned **${email}** and cleared revocation flags.`);
    } catch (err) {
        return interaction.editReply(`Unban failed: ${err.message}`);
    }
}

const adminHandlers = {
    'admin-lookup': handleAdminLookup,
    'admin-sync': handleAdminSync,
    'admin-grant': handleAdminGrant,
    'admin-ban': handleAdminBan,
    'admin-unban': handleAdminUnban,
};

module.exports = { adminHandlers, COURSE_CHOICES };
