import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - using actual values or environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBPWtRGCEUUT6gq3Vupn9WhKH-ySKRNs-M",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "erp--dtrs-pro.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "erp--dtrs-pro",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "erp--dtrs-pro.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "580891661546",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:580891661546:web:fd83263cdb3540a455f393",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;


