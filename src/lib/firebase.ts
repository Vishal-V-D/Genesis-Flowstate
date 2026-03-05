// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Firebase configuration is loaded from environment variables.
// Copy .env.example → .env.local and fill in your project values.
const firebaseConfig = {
  apiKey: "AIzaSyCUDwvNgc0oTsuxqWMYMeBmeSIrYyXFXTc",
  authDomain: "flowstate-312dc.firebaseapp.com",
  projectId: "flowstate-312dc",
  storageBucket: "flowstate-312dc.firebasestorage.app",
  messagingSenderId: "551199643379",
  appId: "1:551199643379:web:dac2a7c3eb9acbd2874986",
  measurementId: "G-NEEDC8TK3D"
};

// Initialize Firebase (guard against hot-reload re-initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export { app, auth, db, rtdb };
