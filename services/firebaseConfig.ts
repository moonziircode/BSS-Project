import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Safe Environment Variable Accessor with Default Fallbacks for Preview
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    console.error(`Error reading env var ${key}`, e);
  }
  
  // Return fallback if env var is missing (Essential for this preview environment to work)
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY", "AIzaSyBc3_H7nAUuBundM2vdseGgACThzI1K1L0"),
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN", "be-dashboard-b5f44.firebaseapp.com"),
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID", "be-dashboard-b5f44"),
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET", "be-dashboard-b5f44.firebasestorage.app"),
  messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID", "738244561982"),
  appId: getEnvVar("VITE_FIREBASE_APP_ID", "1:738244561982:web:03fc1b321cee437e23156f"),
  measurementId: getEnvVar("VITE_FIREBASE_MEASUREMENT_ID", "G-290XHNBEYR")
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log("Persistence failed: multiple tabs open");
  } else if (err.code === 'unimplemented') {
    console.log("Browser does not support persistence");
  }
});

export { app, analytics, db };