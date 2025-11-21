import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Using hardcoded credentials to ensure immediate functionality in the preview environment.
// In a production build, you should replace these with process.env or import.meta.env variables.
const firebaseConfig = {
  apiKey: "AIzaSyBc3_H7nAUuBundM2vdseGgACThzI1K1L0",
  authDomain: "be-dashboard-b5f44.firebaseapp.com",
  projectId: "be-dashboard-b5f44",
  storageBucket: "be-dashboard-b5f44.firebasestorage.app",
  messagingSenderId: "738244561982",
  appId: "1:738244561982:web:03fc1b321cee437e23156f",
  measurementId: "G-290XHNBEYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };