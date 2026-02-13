const axios = require('axios');

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1465807681578074414/e3D7Zth20LPKFCpgBgJGURznU0UYErl-NrSrE-XDswNO1if_by5a57BpmABqww6PBJs8";

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, id, product } = req.body;

    if (!name || !id) {
        return res.status(400).json({ error: "Missing name or id" });
    }

    try {
        await axios.post(DISCORD_WEBHOOK_URL, {
            content: `**New Purchase Intent**\n**User:** ${name}\n**ID:** \`${id}\`\n**Product:** ${product || "Unknown"}\n**Date:** ${new Date().toLocaleString()}`
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Discord Webhook Error", error.message);
        res.status(500).json({ error: "Failed to notify" });
    }
};
