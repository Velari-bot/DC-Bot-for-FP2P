// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDV32xgSFSwsWvtkNxv2egnxKicprCuxp0",
    authDomain: "fp2p-bcd48.firebaseapp.com",
    projectId: "fp2p-bcd48",
    messagingSenderId: "406095855254",
    appId: "1:406095855254:web:fdffa763d426c454000cb7",
    measurementId: "G-59FKMDPYMG"
};

import { getStorage } from "firebase/storage";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
