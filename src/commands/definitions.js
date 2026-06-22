const { SlashCommandBuilder } = require('discord.js');
const { COURSE_CHOICES } = require('./courseChoices');

function getCommandDefinitions() {
    return [
        new SlashCommandBuilder()
            .setName('sync')
            .setDescription('Sync your Discord roles with your website subscriptions'),
        new SlashCommandBuilder()
            .setName('status')
            .setDescription('Account link status, credits, and active roles'),
        new SlashCommandBuilder()
            .setName('subscriptions')
            .setDescription('List your active website subscriptions and purchases'),
        new SlashCommandBuilder()
            .setName('credits')
            .setDescription('Show your 1:1 coaching credits'),
        new SlashCommandBuilder()
            .setName('link')
            .setDescription('Connect your Discord and Epic Games accounts'),
        new SlashCommandBuilder()
            .setName('connections')
            .setDescription('View and manage your connected game accounts'),
        new SlashCommandBuilder()
            .setName('support')
            .setDescription('Help links for billing, courses, and Discord roles'),
        new SlashCommandBuilder()
            .setName('live')
            .setDescription('Check if Deckzee is streaming now'),
        new SlashCommandBuilder()
            .setName('admin-lookup')
            .setDescription('[Admin] Look up a user by email')
            .addStringOption((o) => o.setName('email').setDescription('User email').setRequired(true)),
        new SlashCommandBuilder()
            .setName('admin-sync')
            .setDescription('[Admin] Re-sync Discord roles for a user')
            .addStringOption((o) => o.setName('email').setDescription('User email').setRequired(true)),
        new SlashCommandBuilder()
            .setName('admin-grant')
            .setDescription('[Admin] Grant course access')
            .addStringOption((o) => o.setName('email').setDescription('User email').setRequired(true))
            .addStringOption((o) =>
                o.setName('course').setDescription('Course').setRequired(true).addChoices(...COURSE_CHOICES)
            )
            .addStringOption((o) =>
                o
                    .setName('duration')
                    .setDescription('Access duration')
                    .setRequired(true)
                    .addChoices(
                        { name: '7 days', value: '7d' },
                        { name: '30 days', value: '30d' },
                        { name: '90 days', value: '90d' },
                        { name: '1 year', value: '1y' },
                        { name: 'Forever', value: 'forever' }
                    )
            )
            .addStringOption((o) => o.setName('reason').setDescription('Reason for grant')),
        new SlashCommandBuilder()
            .setName('admin-ban')
            .setDescription('[Admin] Ban user and revoke access')
            .addStringOption((o) => o.setName('email').setDescription('User email').setRequired(true))
            .addStringOption((o) => o.setName('reason').setDescription('Ban reason')),
        new SlashCommandBuilder()
            .setName('admin-unban')
            .setDescription('[Admin] Unban user and restore payments')
            .addStringOption((o) => o.setName('email').setDescription('User email').setRequired(true)),
    ].map((c) => c.toJSON());
}

module.exports = { getCommandDefinitions };
