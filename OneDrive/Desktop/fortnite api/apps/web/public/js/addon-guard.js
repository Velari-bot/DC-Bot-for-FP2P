// Add-on Access Guard
// Restricts access to pages based on user's purchased add-ons

(function() {
    'use strict';
    
    // Define which pages require which add-ons
    const ADDON_REQUIREMENTS = {
        '/analyze.html': 'Gameplay Analysis',
        '/upload-replay.html': 'Gameplay Analysis',
        '/voice.html': 'Voice Interaction',
        '/tweets.html': 'Competitive Insights',
        '/tournaments.html': 'Competitive Insights'
    };
    
    // Addon name mappings (Firestore uses different names)
    const ADDON_NAME_MAP = {
        'Gameplay Analysis': ['Gameplay Analysis', 'gameplay', 'Gameplay'],
        'Voice Interaction': ['Voice Interaction', 'voice', 'Voice'],
        'Competitive Insights': ['Competitive Insights', 'competitive', 'Competitive', 'Competitive Add-on']
    };
    
    // Check if user has a specific add-on (checks Firestore + localStorage)
    async function hasAddon(addonName) {
        // Get user ID
        const userStr = localStorage.getItem('pathgen_user');
        if (!userStr) return false;
        
        try {
            const user = JSON.parse(userStr);
            const userId = user.id || user.uid || user.discordId;
            
            // Check if user is premium first
            let isPremium = user.isPremium === true || user.plan === 'pro';
            
            // Check Firestore for subscription (more reliable)
            if (typeof firebase !== 'undefined' && firebase.firestore && userId) {
                try {
                    const db = firebase.firestore();
                    
                    // Check subscriptions collection
                    const subDoc = await db.collection('subscriptions').doc(userId).get();
                    if (subDoc.exists) {
                        const subData = subDoc.data();
                        isPremium = subData?.plan === 'pro' || subData?.status === 'active';
                        
                        // Check addons in subscription document
                        const addons = subData?.addons;
                        if (addons) {
                            // Check object format: { competitive: true, voice: false, ... }
                            const addonKeys = ADDON_NAME_MAP[addonName] || [addonName];
                            for (const key of addonKeys) {
                                const lowerKey = key.toLowerCase();
                                if (addons[lowerKey] === true || addons[lowerKey] === 'true') {
                                    return true;
                                }
                                // Also check original case
                                if (addons[key] === true || addons[key] === 'true') {
                                    return true;
                                }
                            }
                            
                            // Check array format: ['Competitive Insights', 'Voice Interaction']
                            if (Array.isArray(addons)) {
                                for (const addonKey of addonKeys) {
                                    if (addons.includes(addonKey)) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Fallback: Check user document
                    const userDoc = await db.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        isPremium = isPremium || userData?.isPremium || userData?.plan === 'pro';
                        
                        const userAddons = userData?.addons;
                        if (userAddons) {
                            const addonKeys = ADDON_NAME_MAP[addonName] || [addonName];
                            if (Array.isArray(userAddons)) {
                                for (const addonKey of addonKeys) {
                                    if (userAddons.includes(addonKey)) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                } catch (firestoreError) {
                    console.warn('[ADDON-GUARD] Firestore check failed, using localStorage:', firestoreError);
                }
            }
            
            // Fallback to localStorage
            if (!isPremium) {
                return false;
            }
            
            const userAddons = user.addons;
            if (userAddons && Array.isArray(userAddons)) {
                const addonKeys = ADDON_NAME_MAP[addonName] || [addonName];
                for (const addonKey of addonKeys) {
                    if (userAddons.includes(addonKey)) {
                        return true;
                    }
                }
            }
            
            return false;
        } catch (e) {
            console.error('[ADDON-GUARD] Error checking addon:', e);
            return false;
        }
    }
    
    // Check if user is premium (checks Firestore + localStorage)
    async function isPremium() {
        const userStr = localStorage.getItem('pathgen_user');
        if (!userStr) return false;
        
        try {
            const user = JSON.parse(userStr);
            let isPremium = user.isPremium === true || user.plan === 'pro';
            const userId = user.id || user.uid || user.discordId;
            
            // Check Firestore
            if (typeof firebase !== 'undefined' && firebase.firestore && userId) {
                try {
                    const db = firebase.firestore();
                    
                    // Check subscriptions collection first
                    const subDoc = await db.collection('subscriptions').doc(userId).get();
                    if (subDoc.exists) {
                        const subData = subDoc.data();
                        if (subData?.plan === 'pro' || subData?.status === 'active') {
                            return true;
                        }
                    }
                    
                    // Fallback: Check user document
                    const userDoc = await db.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        isPremium = isPremium || userData?.isPremium || userData?.plan === 'pro';
                    }
                } catch (firestoreError) {
                    console.warn('[ADDON-GUARD] Firestore check failed, using localStorage:', firestoreError);
                }
            }
            
            return isPremium;
        } catch (e) {
            return false;
        }
    }
    
    // Enforce add-on access (async)
    // NOTE: Only feature pages are restricted. All other pages are accessible to everyone.
    async function enforceAddonAccess() {
        const currentPath = window.location.pathname;
        const requiredAddon = ADDON_REQUIREMENTS[currentPath];
        
        if (!requiredAddon) {
            // Page doesn't require specific add-on - allow access to everyone
            return true;
        }
        
        // Only restrict feature pages - check if user is premium
        const premium = await isPremium();
        if (!premium) {
            if (typeof window.showSubscriptionModal === 'function') {
                window.showSubscriptionModal(
                    'PathGen Pro Required',
                    'This feature requires PathGen Pro subscription. Upgrade now to access all coaching features!'
                );
            } else {
                alert('This feature requires PathGen Pro. Please upgrade to access.');
            }
            setTimeout(() => window.location.href = '/subscribe.html', 2000);
            return false;
        }
        
        // Check if user has the required add-on
        const hasAccess = await hasAddon(requiredAddon);
        if (!hasAccess) {
            if (typeof window.showSubscriptionModal === 'function') {
                window.showSubscriptionModal(
                    `"${requiredAddon}" Add-on Required`,
                    `This feature requires the "${requiredAddon}" add-on. Upgrade your subscription to unlock this feature!`
                );
            } else {
                alert(`This feature requires the "${requiredAddon}" add-on. Please upgrade your subscription to access.`);
            }
            setTimeout(() => window.location.href = '/subscribe.html', 2000);
            return false;
        }
        
        return true;
    }
    
    // Wait for Firebase to load, then run
    function initAddonGuard() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            enforceAddonAccess();
        } else {
            // Wait for Firebase to load
            window.addEventListener('firebase-ready', () => {
                enforceAddonAccess();
            });
            
            // Also try after a delay
            setTimeout(() => {
                enforceAddonAccess();
            }, 1000);
        }
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAddonGuard);
    } else {
        initAddonGuard();
    }
    
    // Export for use in other scripts
    window.addonGuard = {
        hasAddon: hasAddon,
        isPremium: isPremium,
        enforceAddonAccess: enforceAddonAccess,
        ADDON_REQUIREMENTS: ADDON_REQUIREMENTS
    };
})();

