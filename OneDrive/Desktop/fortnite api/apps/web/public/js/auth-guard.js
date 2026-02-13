// Authentication and Admin Access Guard
// Use this on all pages to restrict access

(function() {
    'use strict';
    
    const ADMIN_USERNAME = 'crl_coach';
    // Admin whitelist - add usernames here or check Firestore
    const ADMIN_WHITELIST = ['crl_coach']; // Add more usernames as needed
    // Launch date: December 12, 2025 at 12:01 AM (UTC)
    const LAUNCH_DATE = new Date('2025-12-12T00:01:00Z');
    
    // Check if PathGen v2 has launched (after Dec 12, 2025 12:01 AM)
    function isLaunched() {
        const now = new Date();
        return now >= LAUNCH_DATE;
    }
    
    // Check if user is logged in
    function isLoggedIn() {
        const user = localStorage.getItem('pathgen_user') || localStorage.getItem('discordUser');
        return !!user;
    }
    
    // Check if user is admin (synchronous check first, async refresh in background)
    function isAdmin() {
        // Check if user has admin flag in localStorage (set by backend)
        const pathgenUserStr = localStorage.getItem('pathgen_user');
        if (pathgenUserStr) {
            try {
                const pathgenUser = JSON.parse(pathgenUserStr);
                // Check if backend set isAdmin flag
                if (pathgenUser.isAdmin === true || pathgenUser.role === 'admin' || pathgenUser.role === 'owner') {
                    // Refresh admin status in background (async)
                    refreshAdminStatus(pathgenUser.uid || pathgenUser.id);
                    return true;
                }
            } catch (e) {
                // Continue to check other sources
            }
        }
        
        // Fallback: Check username against whitelist
        const discordUserStr = localStorage.getItem('discordUser');
        if (discordUserStr) {
            try {
                const discordUser = JSON.parse(discordUserStr);
                const username = (discordUser.username || '').toLowerCase();
                if (ADMIN_WHITELIST.some(admin => admin.toLowerCase() === username)) {
                    return true;
                }
            } catch (e) {
                // Continue to check other sources
            }
        }
        
        // Also check pathgen_user for username
        if (pathgenUserStr) {
            try {
                const pathgenUser = JSON.parse(pathgenUserStr);
                const username = (pathgenUser.username || pathgenUser.discordUsername || '').toLowerCase();
                if (ADMIN_WHITELIST.some(admin => admin.toLowerCase() === username)) {
                    return true;
                }
            } catch (e) {
                // Continue
            }
        }
        
        return false;
    }
    
    // Async function to refresh admin status from API (called in background)
    async function refreshAdminStatus(userId) {
        if (!userId) return;
        try {
            const response = await fetch('/api/admin/auth', {
                headers: { 'x-user-id': userId }
            });
            if (response.ok) {
                const data = await response.json();
                // Update localStorage with latest admin status
                const pathgenUserStr = localStorage.getItem('pathgen_user');
                if (pathgenUserStr) {
                    const user = JSON.parse(pathgenUserStr);
                    user.isAdmin = data.isAdmin || false;
                    user.role = data.role || user.role || 'user';
                    localStorage.setItem('pathgen_user', JSON.stringify(user));
                }
            }
        } catch (e) {
            // Silently fail - admin check will use cached/local data
        }
    }
    
    // Pages that are always accessible (even when not logged in)
    const PUBLIC_PAGES = ['/index.html', '/', '/login.html', '/setup.html'];
    
    // Pages that logged-in non-admin users can access before launch
    const ALLOWED_PAGES_BEFORE_LAUNCH = ['/index.html', '/', '/login.html', '/setup.html'];
    
    // Check if current page is a public page
    function isPublicPage() {
        const currentPath = window.location.pathname;
        return PUBLIC_PAGES.some(page => currentPath === page || currentPath.endsWith(page));
    }
    
    // Check if current page is allowed for non-admin users before launch
    function isAllowedPage() {
        const currentPath = window.location.pathname;
        return ALLOWED_PAGES_BEFORE_LAUNCH.some(page => currentPath === page || currentPath.endsWith(page));
    }
    
    // Main auth guard function
    // DISABLED: All pages are now accessible without authentication
    function enforceAuth() {
        // Allow all pages to be accessible
        return true;
    }
    
    // Don't run auth enforcement - allow all access
    // enforceAuth();
    
    // Also run on DOMContentLoaded as backup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enforceAuth);
    }
    
    // DISABLED: Click interception removed - allow all navigation
    // All pages are now accessible without authentication checks
    // document.addEventListener('click', function(e) {
    //     // Navigation interception disabled
    // });
    
    // Refresh admin status on page load for logged-in users
    function initAdminRefresh() {
        const pathgenUserStr = localStorage.getItem('pathgen_user');
        if (pathgenUserStr) {
            try {
                const user = JSON.parse(pathgenUserStr);
                if (user.uid || user.id) {
                    refreshAdminStatus(user.uid || user.id);
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }
    
    // Run admin refresh on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminRefresh);
    } else {
        initAdminRefresh();
    }
    
    // Export functions for use in other scripts
    window.authGuard = {
        isLoggedIn: isLoggedIn,
        isAdmin: isAdmin,
        isLaunched: isLaunched,
        enforceAuth: enforceAuth,
        refreshAdminStatus: refreshAdminStatus
    };
})();

