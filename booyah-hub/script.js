// script.js
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Access Granted: User is logged in as", user.uid);
  } else {
    // Secure redirect layer
    window.location.href = "login.html";
  }
});