
// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { collection, doc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_XTUNNUYJ5IYoZohLv_wjtzutti8IGbU",
  authDomain: "imagegen-7ce94.firebaseapp.com",
  projectId: "imagegen-7ce94",
  storageBucket: "imagegen-7ce94.firebasestorage.app",
  messagingSenderId: "1095842184504",
  appId: "1:1095842184504:web:b5ba98a9845a2098ded5cd",
  measurementId: "G-9C7QQZR2CX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Helper functions for user data
export const getUserCreditsRef = (userId: string) => {
  return doc(db, 'user_credits', userId);
};

export default app;
