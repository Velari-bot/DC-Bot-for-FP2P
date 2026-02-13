const { S3Client } = require("@aws-sdk/client-s3");

const R2_ACCOUNT_ID = (process.env.R2_ACCOUNT_ID || "a22d72c334d2bf7722a6ab6e3300163e").trim();
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.trim() : null;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ? process.env.R2_SECRET_ACCESS_KEY.trim() : null;

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn("R2 Credentials missing! Uploads will fail.");
}

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

module.exports = r2;
