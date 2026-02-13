const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();

async function findUser() {
    const username = "uno0fortnite";
    console.log(`Searching for user: ${username}`);

    try {
        const listUsers = await admin.auth().listUsers();
        listUsers.users.forEach(user => {
            if (user.displayName === username || user.email?.toLowerCase().includes(username.toLowerCase())) {
                console.log(`MATCH FOUND:`);
                console.log(`UID: ${user.uid}`);
                console.log(`Email: ${user.email}`);
                console.log(`DisplayName: ${user.displayName}`);
                console.log(`Disabled: ${user.disabled}`);
            }
        });
    } catch (err) {
        console.error("Search failed:", err);
    }
}

findUser();
