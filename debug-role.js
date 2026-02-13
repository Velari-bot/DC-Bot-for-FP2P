require('dotenv').config();
const axios = require('axios');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN.replace(/"/g, '').trim();
const GUILD_ID = process.env.PUBLIC_SERVER_ID || "1438281060298526823"; // Fallback to provided guild ID
const USER_ID = "1244123755073114204"; // The user from DB (fixed)
const ROLE_ID = "1471937065229881355"; // Fighting Masterclass Role

async function testRoleAssignment() {
    console.log(`[TEST] Attempting to assign Role ${ROLE_ID} to User ${USER_ID} in Guild ${GUILD_ID}`);
    console.log(`[TEST] Token Start: ${DISCORD_TOKEN.substring(0, 10)}...`);

    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${USER_ID}/roles/${ROLE_ID}`;

    try {
        const response = await axios.put(url, {}, {
            headers: {
                Authorization: `Bot ${DISCORD_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("✅ Success! Status:", response.status);
    } catch (error) {
        console.error("❌ Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testRoleAssignment();
