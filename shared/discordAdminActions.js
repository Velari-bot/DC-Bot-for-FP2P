const admin = require('./firebaseAdmin');
const { reconcileUserByUid } = require('./discordBot');
const { ADMIN_EMAILS } = require('./adminConstants');

const db = admin.firestore();

function parseAdminDiscordIds() {
    const raw = process.env.ADMIN_DISCORD_IDS || '';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function parseAdminRoleIds() {
    const multi = process.env.DISCORD_ADMIN_ROLE_IDS || '';
    const single = (process.env.DISCORD_ADMIN_ROLE_ID || '').replace(/"/g, '').trim();
    const ids = multi.split(',').map((s) => s.trim()).filter(Boolean);
    if (single && !ids.includes(single)) ids.push(single);
    return ids;
}

async function getLinkedUserByDiscordId(discordUserId) {
    const snap = await db.collection('users').where('discordId', '==', discordUserId).limit(1).get();
    if (snap.empty) return null;
    return { uid: snap.docs[0].id, data: snap.docs[0].data() };
}

async function isDiscordAdmin(discordUserId, memberRoles = []) {
    if (parseAdminDiscordIds().includes(discordUserId)) return true;

    const adminRoleIds = parseAdminRoleIds();
    if (adminRoleIds.some((id) => memberRoles.includes(id))) return true;

    const linked = await getLinkedUserByDiscordId(discordUserId);
    if (linked?.data?.email && ADMIN_EMAILS.includes(linked.data.email.toLowerCase())) {
        return true;
    }

    return false;
}

async function lookupByEmail(targetEmail) {
    const email = targetEmail.trim().toLowerCase();
    let uid;
    let userRecord;

    try {
        userRecord = await admin.auth().getUserByEmail(email);
        uid = userRecord.uid;
    } catch (e) {
        const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
        if (userQuery.empty) throw new Error(`User ${email} not found`);
        uid = userQuery.docs[0].id;
        const userData = userQuery.docs[0].data();
        userRecord = {
            uid,
            email,
            disabled: userData.banned || false,
        };
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const paymentsSnap = await db.collection('users').doc(uid).collection('payments').get();
    const payments = paymentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return { uid, email, userRecord, userData, payments };
}

async function grantAccess({ targetEmail, courseId, durationValue, durationUnit, reason, adminEmail }) {
    const email = targetEmail.trim().toLowerCase();
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;

    let expiresAt = null;
    const now = new Date();
    const expiryDate = new Date();

    if (durationUnit !== 'forever') {
        const val = parseInt(durationValue, 10);
        if (Number.isNaN(val) || val <= 0) throw new Error('Invalid duration value');
        if (durationUnit === 'days') expiryDate.setDate(expiryDate.getDate() + val);
        else if (durationUnit === 'weeks') expiryDate.setDate(expiryDate.getDate() + val * 7);
        else if (durationUnit === 'months') expiryDate.setMonth(expiryDate.getMonth() + val);
        else if (durationUnit === 'years') expiryDate.setFullYear(expiryDate.getFullYear() + val);
        expiresAt = expiryDate.toISOString();
    }

    let courseTitle = courseId;
    const cDoc = await db.collection('courses').doc(courseId).get();
    if (cDoc.exists) courseTitle = cDoc.data().title;

    const paymentId = `admin_grant_${now.getTime()}`;
    const paymentData = {
        date: now.toISOString(),
        item: `Admin Grant: ${courseTitle}`,
        productId: courseId,
        amount: '0.00',
        credits: 0,
        stripeSessionId: paymentId,
        email,
        type: 'course',
        adminGrant: true,
        grantedBy: adminEmail || 'discord-admin',
        reason: reason || 'Manual Admin Access',
        expiresAt,
    };

    await db.collection('users').doc(userId).collection('payments').doc(paymentId).set(paymentData);
    await reconcileUserByUid(userId);

    return { userId, courseTitle, expiresAt };
}

async function banUser({ targetEmail, reason }) {
    const email = targetEmail.trim().toLowerCase();
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    await admin.auth().updateUser(uid, { disabled: true });

    const paymentsSnap = await db.collection('users').doc(uid).collection('payments').get();
    const batch = db.batch();

    paymentsSnap.forEach((doc) => {
        batch.update(doc.ref, {
            expiresAt: new Date(0).toISOString(),
            revokedAt: new Date().toISOString(),
            revokedReason: reason || 'Banned by Admin',
        });
    });

    batch.set(db.collection('users').doc(uid), {
        banned: true,
        bannedAt: new Date().toISOString(),
        banReason: reason || 'No reason provided',
    }, { merge: true });

    await batch.commit();
    await reconcileUserByUid(uid);

    return { uid, email };
}

async function unbanUser({ targetEmail }) {
    const email = targetEmail.trim().toLowerCase();
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    await admin.auth().updateUser(uid, { disabled: false });

    const paymentsSnap = await db.collection('users').doc(uid).collection('payments').get();
    const batch = db.batch();

    paymentsSnap.forEach((doc) => {
        batch.update(doc.ref, {
            expiresAt: admin.firestore.FieldValue.delete(),
            revokedAt: admin.firestore.FieldValue.delete(),
            revokedReason: admin.firestore.FieldValue.delete(),
        });
    });

    batch.set(db.collection('users').doc(uid), {
        banned: false,
        unbannedAt: new Date().toISOString(),
        securityStrikes: 0,
        accessRevoked: false,
        revocationReason: admin.firestore.FieldValue.delete(),
    }, { merge: true });

    await batch.commit();
    await reconcileUserByUid(uid);

    return { uid, email };
}

module.exports = {
    isDiscordAdmin,
    getLinkedUserByDiscordId,
    lookupByEmail,
    grantAccess,
    banUser,
    unbanUser,
    ADMIN_EMAILS,
};
