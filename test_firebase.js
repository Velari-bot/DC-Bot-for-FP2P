require("dotenv").config();

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
console.log("B64 Length:", b64?.length || 0);

if (b64) {
    try {
        const decoded = Buffer.from(b64, "base64").toString("utf8");
        console.log("Decoded first 60 chars:", decoded.substring(0, 60));
        const json = JSON.parse(decoded);
        console.log("Project ID:", json.project_id);
        console.log("Client Email:", json.client_email);
        console.log("SUCCESS: Firebase credentials are valid!");
    } catch (e) {
        console.log("ERROR:", e.message);
    }
} else {
    console.log("ERROR: FIREBASE_SERVICE_ACCOUNT_B64 is not set");
}
