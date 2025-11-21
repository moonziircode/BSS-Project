import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

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