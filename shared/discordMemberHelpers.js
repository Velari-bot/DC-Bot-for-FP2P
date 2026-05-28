const { isPaymentActive, paymentToRoleId, ROLE_MAPPING, MANAGED_ROLE_IDS } = require('./discordBot');

const ROLE_ID_TO_LABEL = {};
for (const [key, roleId] of Object.entries(ROLE_MAPPING)) {
    if (!ROLE_ID_TO_LABEL[roleId]) {
        ROLE_ID_TO_LABEL[roleId] = key.replace(/_/g, ' ');
    }
}

const PRODUCT_LABELS = {
    beginner_masterclass: 'Beginner Masterclass',
    intermediate_masterclass: 'Intermediate Masterclass',
    advanced_masterclass: 'Advanced Masterclass',
    tO4MriPtFjmoksUbpXdQ: 'Fighting Masterclass',
    bs64jytqsop75zzV5FKr: 'Beginner Masterclass',
    YptLrG7dRXf5As19GEks: 'Intermediate Masterclass',
    P2HYKXsPngTDxPyidPzs: 'Advanced Masterclass',
    single_coaching: '1:1 Coaching',
    basic_season: 'Basic Seasonal Coaching',
    advanced_season: 'Advanced Seasonal Coaching',
    vod_review: 'VOD Review Membership',
    fighting_1v1_single: 'Fighting 1v1 Session',
    fighting_1v1_double: 'Fighting 1v1 Session',
    fighting_1v1_all: 'Fighting 1v1 Session',
};

function maskEmail(email) {
    if (!email || !email.includes('@')) return '—';
    const [local, domain] = email.split('@');
    const maskedLocal = local.length <= 2 ? `${local[0]}*` : `${local[0]}***${local[local.length - 1]}`;
    return `${maskedLocal}@${domain}`;
}

function paymentLabel(payment) {
    if (payment.item) return payment.item;
    if (payment.productId && PRODUCT_LABELS[payment.productId]) return PRODUCT_LABELS[payment.productId];
    return payment.productId || 'Purchase';
}

function formatExpiry(payment) {
    if (!payment.expiresAt) return 'No expiry';
    const d = new Date(payment.expiresAt);
    if (Number.isNaN(d.getTime())) return 'No expiry';
    if (d.getTime() <= 0) return 'Revoked';
    return d.toLocaleDateString();
}

function getActiveEntitlements(payments) {
    return payments
        .filter(isPaymentActive)
        .map((p) => ({
            label: paymentLabel(p),
            expires: formatExpiry(p),
            hasRole: !!paymentToRoleId(p),
        }));
}

function getActiveRoleLabels(payments) {
    const labels = new Set();
    for (const p of payments) {
        const roleId = paymentToRoleId(p);
        if (roleId) labels.add(ROLE_ID_TO_LABEL[roleId] || 'Subscription');
    }
    return [...labels];
}

module.exports = {
    maskEmail,
    paymentLabel,
    formatExpiry,
    getActiveEntitlements,
    getActiveRoleLabels,
    ROLE_ID_TO_LABEL,
    PRODUCT_LABELS,
    MANAGED_ROLE_IDS,
};
