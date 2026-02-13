// Firebase Configuration
// This file initializes Firebase using the CDN compat SDK

// Prevent duplicate declarations
if (typeof firebaseConfig === 'undefined') {
  // Firebase configuration
  var firebaseConfig = {
  apiKey: "AIzaSyCi0E0E0rK1awSUTsoqI5p6g_6Ug_EBxKs",
  authDomain: "pathgen-v2.firebaseapp.com",
  projectId: "pathgen-v2",
  storageBucket: "pathgen-v2.firebasestorage.app",
  messagingSenderId: "64409929315",
  appId: "1:64409929315:web:a8fefd3bcb7749ef6b1a56",
  measurementId: "G-JWC8N4H6FL"
  };
}

// Initialize Firebase when the SDK is loaded
function initializeFirebase() {
  if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
    try {
      // Initialize Firebase
      const app = firebase.initializeApp(firebaseConfig);
      
      // Initialize Analytics (only in browser)
      let analytics = null;
      if (typeof window !== 'undefined' && firebase.analytics) {
        analytics = firebase.analytics();
      }
      
      // Initialize Auth
      const auth = firebase.auth();
      
      // Initialize Firestore
      const db = firebase.firestore();
      
      // Make available globally
      window.firebaseApp = app;
      window.firebaseAuth = auth;
      window.firebaseDb = db;
      if (analytics) {
        window.firebaseAnalytics = analytics;
      }
      
      console.log('✅ Firebase initialized successfully');
      console.log('📊 Analytics:', analytics ? 'enabled' : 'disabled');
      console.log('🔐 Auth:', auth ? 'enabled' : 'disabled');
      console.log('💾 Firestore:', db ? 'enabled' : 'disabled');
      
      return { app, auth, db, analytics };
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      return null;
    }
  } else if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    // Firebase already initialized
    const app = firebase.app();
    window.firebaseApp = app;
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();
    if (firebase.analytics) {
      window.firebaseAnalytics = firebase.analytics();
    }
    console.log('✅ Firebase already initialized');
    return {
      app: window.firebaseApp,
      auth: window.firebaseAuth,
      db: window.firebaseDb,
      analytics: window.firebaseAnalytics
    };
  } else {
    console.error('❌ Firebase SDK not loaded');
    return null;
  }
}

// Auto-initialize when DOM is ready and Firebase SDK is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Firebase SDK to load
    setTimeout(initializeFirebase, 100);
  });
} else {
  // DOM already loaded, wait for Firebase SDK
  setTimeout(initializeFirebase, 100);
}

// Also try to initialize immediately if Firebase is already loaded
if (typeof firebase !== 'undefined') {
  initializeFirebase();
}
