const admin = require('./utils/firebaseAdmin');
const axios = require('axios');
const db = admin.firestore();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

const { syncUserRoles } = require('./utils/discordBot');

module.exports = async (req, res) => {
    const { action, code, state } = req.query;

    // Determine Redirect URI dynamically based on request
    let REDIRECT_URI;
    const host = req.headers.host;

    // Check if running on localhost (dev environment)
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        // In dev, the frontend is usually on port 3000, but the API might be on 4000.
        // However, the browser URL is what matters for the callback.
        // If we are proxying, the browser sees port 3000.
        REDIRECT_URI = `http://localhost:3000/api/discord-auth?action=callback`;
    } else {
        // Production
        REDIRECT_URI = `https://${host}/api/discord-auth?action=callback`;
    }

    if (action === 'url') {
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
        return res.json({ url });
    }

    if (action === 'callback') {
        if (!code) return res.status(400).send('Missing code');

        try {
            // Exchange code for token
            const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token } = tokenResponse.data;

            // Get User Info
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const discordUser = userResponse.data;

            // We need the Firebase User ID to link. 
            // Since we can't search by state easily if we didn't store it, 
            // we'll assume the client will handle the response.
            // But normally we'd redirect back to a frontend page that then calls another endpoint to link.

            // Alternative: The frontend opens this in a popup, and we return a script that messages the opener.
            return res.send(`
                <script>
                    window.opener.postMessage({ 
                        type: 'DISCORD_AUTH_SUCCESS', 
                        user: ${JSON.stringify(discordUser)} 
                    }, '*');
                    window.close();
                </script>
                Linking successful! You can close this window.
            `);

        } catch (error) {
            console.error('Discord Auth Error:', error.response?.data || error.message);
            return res.status(500).send('Authentication failed');
        }
    }

    if (action === 'link') {
        // This is called from the frontend with the discord ID and the Firebase Token
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            const { discordId, discordTag, discordAvatar } = req.body;

            if (!discordId) return res.status(400).json({ error: 'Missing Discord ID' });

            await db.collection('users').doc(uid).set({
                discordId,
                discordTag,
                discordAvatar,
                discordLinkedAt: new Date().toISOString()
            }, { merge: true });

            // Trigger role sync immediately
            await syncUserRoles(uid, discordId);

            return res.json({ success: true, message: 'Discord linked successfully' });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: e.message });
        }
    }

    if (action === 'unlink') {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            await db.collection('users').doc(uid).update({
                discordId: admin.firestore.FieldValue.delete(),
                discordTag: admin.firestore.FieldValue.delete(),
                discordAvatar: admin.firestore.FieldValue.delete(),
                discordLinkedAt: admin.firestore.FieldValue.delete()
            });

            return res.json({ success: true, message: 'Discord disconnected' });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(400).json({ error: 'Invalid action' });
};
