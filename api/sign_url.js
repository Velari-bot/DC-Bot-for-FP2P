const admin = require('./utils/firebaseAdmin');

module.exports = async (req, res) => {
    try {
        const { path } = req.query;
        const authHeader = req.headers.authorization;

        if (!path) {
            return res.status(400).json({ error: 'Missing path parameter' });
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        try {
            await admin.auth().verifyIdToken(idToken);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get the bucket
        // You might need to set storageBucket in your firebase admin init or env
        // Defaults to default bucket if not specified
        const bucket = admin.storage().bucket();
        const file = bucket.file(path);

        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });

        return res.status(200).json({ url });

    } catch (error) {
        console.error("Error signing URL:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
