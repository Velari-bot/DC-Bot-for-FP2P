const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const r2 = require('./utils/r2');
const admin = require('./utils/firebaseAdmin');

module.exports = async (req, res) => {
    try {
        // Auth Check
        /*
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const idToken = authHeader.split('Bearer ')[1];
        try {
            await admin.auth().verifyIdToken(idToken);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        */

        const { filename, contentType, folder } = req.body;

        if (!filename || !contentType) {
            return res.status(400).json({ error: 'Missing filename or contentType' });
        }

        const bucketName = process.env.R2_BUCKET_NAME || "fp2p-content"; // Fallback or assume user sets this
        const key = `${folder || 'uploads'}/${Date.now()}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
        });

        // Generate signed URL for upload (valid for 15 mins)
        const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

        // Construct public URL (User must configure R2_PUBLIC_DOMAIN or make bucket public)
        // If R2_PUBLIC_DOMAIN is "assets.mydomain.com", url is "https://assets.mydomain.com/key"
        const publicDomain = process.env.R2_PUBLIC_DOMAIN;
        const publicUrl = publicDomain
            ? `https://${publicDomain}/${key}`
            : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`; // Note: This is usually private auth-only

        return res.status(200).json({
            uploadUrl,
            publicUrl,
            key
        });

    } catch (error) {
        console.error("Error generating upload URL:", error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
