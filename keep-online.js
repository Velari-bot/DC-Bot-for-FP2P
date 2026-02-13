const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // Need to `npm install discord.js dotenv`

// Minimal setup just to bring the bot online
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    console.log(`🟢 Bot is now ONLINE`);

    // Optional: Set a status
    client.user.setActivity('Path To Pro Students', { type: 3 }); // "Watching Path To Pro Students"
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error("❌ DISCORD_TOKEN is missing from .env file");
    process.exit(1);
}

// Login
client.login(token);

// Keep alive logic (optional, for simple hosting services)
const http = require('http');
http.createServer((req, res) => {
    res.write('Bot is alive!');
    res.end();
}).listen(8080);
