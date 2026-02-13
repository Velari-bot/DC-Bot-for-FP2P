require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const admin = require('./api/utils/firebaseAdmin');
// const admin = require('firebase-admin'); // Processed in utils

// --- 1. Initialize Firebase Admin ---
// Initialization is handled in ./api/utils/firebaseAdmin.js
const db = admin.firestore();

// --- 2. Initialize Discord Client ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel]
});

// --- 3. Role Mapping ---
const ROLE_MAPPING = {
    // Masterclasses
    'beginner_masterclass': '1444829030263165109',
    'intermediate_masterclass': '1444829519964930088',
    'advanced_masterclass': '1444829551984378027',
    'tO4MriPtFjmoksUbpXdQ': '1471937065229881355', // Fighting Masterclass ID
    'fighting_masterclass': '1471937065229881355', // Fighting Masterclass Name (just in case)

    // Coaching
    'single_coaching': '1456799859108479190',
    'basic_season': '1456799883519594680',
    'advanced_season': '1456799919238025358',
    'vod_review': '1456799809666154584',

    // 1v1 Marius
    'fighting_1v1_single': '1471937237988937932',
    'fighting_1v1_double': '1471937237988937932',
    'fighting_1v1_all': '1471937237988937932'
};

const GUILD_ID = process.env.PUBLIC_SERVER_ID || "1438281060298526823";

// --- 4. Logic ---
client.on('ready', () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    client.user.setActivity('Path To Pro Students', { type: 3 }); // Watching...
});

client.on('messageCreate', async (message) => {
    // Basic command: !sync
    if (message.content === '!sync') {
        const discordId = message.author.id;
        message.reply("⏳ Syncing your roles... please wait.");

        try {
            // Find user in Firebase by discordId
            const usersSnap = await db.collection('users').where('discordId', '==', discordId).get();

            if (usersSnap.empty) {
                return message.reply("❌ Your Discord account is not linked to any website profile. Please go to the User Dashboard and link it first!");
            }

            const userDoc = usersSnap.docs[0];
            const uid = userDoc.id;
            console.log(`Searching payments for User UID: ${uid}`);

            // Fetch Payments
            const paymentsSnap = await db.collection('users').doc(uid).collection('payments').get();
            const purchases = paymentsSnap.docs.map(doc => ({
                id: doc.id,
                productId: doc.data().productId,
                item: doc.data().item
            }));

            if (purchases.length === 0) {
                return message.reply("ℹ️ No purchases found on your account.");
            }

            const guild = await client.guilds.fetch(GUILD_ID);
            const member = await guild.members.fetch(discordId);
            let addedRoles = [];

            for (const p of purchases) {
                let roleId = ROLE_MAPPING[p.productId];

                // Fuzzy Match Name if ID fails
                if (!roleId && p.item) {
                    const name = p.item.toLowerCase();
                    if (name.includes('fighting')) roleId = ROLE_MAPPING['tO4MriPtFjmoksUbpXdQ'];
                    else if (name.includes('beginner')) roleId = ROLE_MAPPING['beginner_masterclass'];
                    else if (name.includes('intermediate')) roleId = ROLE_MAPPING['intermediate_masterclass'];
                    else if (name.includes('advanced') && !name.includes('season')) roleId = ROLE_MAPPING['advanced_masterclass'];
                    else if (name.includes('vod')) roleId = ROLE_MAPPING['vod_review'];
                    else if (name.includes('1:1') || name.includes('cow')) roleId = ROLE_MAPPING['fighting_1v1_single'];
                }

                if (roleId) {
                    try {
                        await member.roles.add(roleId);
                        addedRoles.push(roleId);
                        console.log(`✅ Added Role ${roleId} for ${p.item || p.productId}`);
                    } catch (err) {
                        console.error(`❌ Start Permission Error for ${roleId}:`, err.message);
                        message.channel.send(`⚠️ Failed to give role <@&${roleId}>. Check bot hierarchy!`);
                    }
                }
            }

            if (addedRoles.length > 0) {
                message.reply(`✅ Successfully synced! Added ${addedRoles.length} roles.`);
            } else {
                message.reply("✅ Sync complete. You already have all your entitled roles.");
            }

        } catch (error) {
            console.error(error);
            message.reply("❌ Error syncing user roles: " + error.message);
        }
    }
});

// Login
const token = process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.replace(/"/g, '').trim() : "";
client.login(token);
