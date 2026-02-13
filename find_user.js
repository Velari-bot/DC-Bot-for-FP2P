const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();

async function findUser() {
    const username = "uno0fortnite";
    console.log(`Searching for user: ${username}`);

    try {
        // 1. Search in Firestore collection 'users'
        const usersSnap = await db.collection('users').get();
        let foundUser = null;

        usersSnap.forEach(doc => {
            const data = doc.data();
            // Check display name, email, or any other relevant field
            if (data.displayName === username || data.email?.includes(username) || doc.id === username) {
                console.log(`Found in Firestore: ${doc.id}`);
                console.log(data);
                foundUser = { uid: doc.id, ...data };
            }
        });

        // 2. Search in Firebase Auth
        try {
            const listUsers = await admin.auth().listUsers();
            listUsers.users.forEach(user => {
                if (user.displayName === username || user.email?.includes(username)) {
                    console.log(`Found in Auth: ${user.uid}`);
                    console.log(user);
                    foundUser = foundUser || { uid: user.uid, email: user.email };
                }
            });
        } catch (e) {
            console.error("Auth listing failed:", e.message);
        }

        if (!foundUser) {
            console.log("No user found with that name.");
        }
    } catch (err) {
        console.error("Search failed:", err);
    }
}

findUser();
