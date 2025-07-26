// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDj1Wt23SVOyy5zHxcwJ0spzL_Scaq-Kd0",
  authDomain: "hotelsell-5efa6.firebaseapp.com",
  databaseURL: "https://hotelsell-5efa6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hotelsell-5efa6",
  storageBucket: "hotelsell-5efa6.firebasestorage.app",
  messagingSenderId: "1097714801507",
  appId: "1:1097714801507:web:5313f0f3c3e3d7c9675156",
  measurementId: "G-C3PFDZSY32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, database, app, analytics, googleProvider }; 