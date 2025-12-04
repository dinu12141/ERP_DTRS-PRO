// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPWtRGCEUUT6gq3Vupn9WhKH-ySKRNs-M",
  authDomain: "erp--dtrs-pro.firebaseapp.com",
  projectId: "erp--dtrs-pro",
  storageBucket: "erp--dtrs-pro.firebasestorage.app",
  messagingSenderId: "580891661546",
  appId: "1:580891661546:web:fd83263cdb3540a455f393",
  measurementId: "G-S7X22JW3FG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);