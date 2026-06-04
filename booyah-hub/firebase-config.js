// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot, arrayUnion } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAso3wugbZnrTty8Aik-d-oiMZLdNq1aZE",
    authDomain: "ff-hub-b225f.firebaseapp.com",
    projectId: "ff-hub-b225f",
    storageBucket: "ff-hub-b225f.firebasestorage.app",
    messagingSenderId: "158561227588",
    appId: "1:158561227588:web:ba2726367d0d8574817d11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };