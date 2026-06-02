// admin.js - Fully Sanitized Production Framework with Explict Scope Bindings & Guard Checks
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAso3wugbZnrTty8Aik-d-oiMZLdNq1aZE",
    authDomain: "ff-hub-b225f.firebaseapp.com",
    projectId: "ff-hub-b225f",
    storageBucket: "ff-hub-b225f.firebasestorage.app",
    messagingSenderId: "158561227588",
    appId: "1:158561227588:web:ba2726367d0d8574817d11"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let unsubscribeAdminTournaments = null;

// AUTHENTICATION MATRIX MONITOR
onAuthStateChanged(auth, (user) => {
    const wall = document.getElementById('admin-auth-wall');
    const shell = document.getElementById('admin-dashboard-shell');
    const logNode = document.getElementById('operator-title-log');

    // Clean up active snapshot listeners to avoid memory leaks
    if(unsubscribeAdminTournaments) {
        unsubscribeAdminTournaments();
        unsubscribeAdminTournaments = null;
    }

    if (user && user.email === "admin@booyahhub.com") {
        if(wall) wall.classList.add('hidden');
        if(shell) shell.classList.remove('hidden');
        if(logNode) logNode.innerText = `SESSION_STATUS: CONNECTED_ROOT (${user.email})`;
        listenToActiveTournamentsAdmin();
    } else {
        if(wall) wall.classList.remove('hidden');
        if(shell) shell.classList.add('hidden');
        if(logNode) logNode.innerText = "SESSION_STATUS: OFFLINE_TERMINAL";
    }
});

// GLOBAL CREDENTIAL VERIFICATION GATEWAY
window.verifyTerminalCredentials = async function() {
    const emailNode = document.getElementById('admin-mobile');
    const pinNode = document.getElementById('admin-pin');
    
    if(!emailNode || !pinNode) return;
    
    const email = emailNode.value.trim();
    const password = pinNode.value;
    
    if(!email || !password) {
        alert("Both fields are mandatory to clear encryption limits.");
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch(err) {
        alert("Authentication Aborted: " + err.message);
    }
};

// GLOBAL LOGOUT EXECUTOR
window.terminateAdminSession = function() {
    signOut(auth);
};

// TOURNAMENT CREATION ENGINE PIPELINE
document.getElementById('create-tournament-pipeline-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('t-title').value.trim();
    const banner = document.getElementById('t-banner').value.trim();
    
    const prize = Math.max(0, parseInt(document.getElementById('t-prize').value, 10) || 0);
    const entryFee = Math.max(0, parseInt(document.getElementById('t-fee').value, 10) || 0);
    const slots = Math.max(2, parseInt(document.getElementById('t-slots').value, 10) || 48);

    if(!title) {
        alert("Tournament title field cannot remain empty.");
        return;
    }

    try {
        await addDoc(collection(db, "tournaments"), {
            title,
            banner: banner || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=500",
            prize,
            entryFee,
            slots,
            registeredPlayers: [],
            timestamp: new Date()
        });
        alert("Pipeline Deployed: Scrim matrix room pushed live!");
        document.getElementById('create-tournament-pipeline-form').reset();
    } catch(err) {
        alert("Pushed Dropped Matrix Failure: " + err.message);
    }
});

// REAL-TIME STREAM LISTENER FOR ADMIN MONITORS
function listenToActiveTournamentsAdmin() {
    if (unsubscribeAdminTournaments) {
        unsubscribeAdminTournaments();
    }
    
    const feed = document.getElementById('admin-active-tournaments-feed');
    // FIXED: Strict DOM Element safe check to avoid asynchronous runtime null errors
    if(!feed) return; 

    unsubscribeAdminTournaments = onSnapshot(collection(db, "tournaments"), (snapshot) => {
        feed.innerHTML = "";

        if(snapshot.empty) {
            feed.innerHTML = `<p class="text-xs text-gray-600 font-mono text-center py-4">No active tournament documents streams online.</p>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const id = docSnap.id;
            const t = docSnap.data();
            const playersCount = t.registeredPlayers ? t.registeredPlayers.length : 0;

            const card = document.createElement('div');
            card.className = "bg-[#0d0e12] border border-gray-800 p-4 rounded-xl flex items-center justify-between";
            card.innerHTML = `
                <div>
                    <h4 class="text-xs font-black uppercase text-white tracking-wide line-clamp-1">${t.title}</h4>
                    <p class="text-[9px] font-mono text-gray-500">ID: ${id} | Registrations: ${playersCount}/${t.slots}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.openEditModal('${id}', '${t.title}', '${t.banner}', ${t.prize}, ${t.entryFee}, ${t.slots})" class="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">Modify</button>
                    <button onclick="window.terminatePipeline('${id}')" class="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">Purge</button>
                </div>
            `;
            feed.appendChild(card);
        });
    });
}

// FIXED: Attached openEditModal to explicit global window reference scope
window.openEditModal = function(id, title, banner, prize, fee, slots) {
    const modal = document.getElementById('edit-tournament-modal');
    
    const idInput = document.getElementById('edit-t-id');
    const titleInput = document.getElementById('edit-t-title');
    const bannerInput = document.getElementById('edit-t-banner');
    const prizeInput = document.getElementById('edit-t-prize');
    const feeInput = document.getElementById('edit-t-fee');
    const slotsInput = document.getElementById('edit-t-slots');

    if(idInput) idInput.value = id;
    if(titleInput) titleInput.value = title;
    if(bannerInput) bannerInput.value = banner;
    if(prizeInput) prizeInput.value = prize;
    if(feeInput) feeInput.value = fee;
    if(slotsInput) slotsInput.value = slots;

    if(modal) { 
        modal.classList.remove('hidden'); 
        modal.classList.add('flex'); 
    }
};

// FIXED: Attached closeEditModal to explicit global window reference scope
window.closeEditModal = function() {
    const modal = document.getElementById('edit-tournament-modal');
    if(modal) { 
        modal.classList.add('hidden'); 
        modal.classList.remove('flex'); 
    }
};

// FIXED: Attached saveTournamentEdits to explicit global window reference scope with strict sanitization boundations
window.saveTournamentEdits = async function() {
    const id = document.getElementById('edit-t-id')?.value;
    const title = document.getElementById('edit-t-title')?.value.trim();
    const banner = document.getElementById('edit-t-banner')?.value.trim();
    
    const prize = Math.max(0, parseInt(document.getElementById('edit-t-prize')?.value, 10) || 0);
    const entryFee = Math.max(0, parseInt(document.getElementById('edit-t-fee')?.value, 10) || 0);
    const slots = Math.max(2, parseInt(document.getElementById('edit-t-slots')?.value, 10) || 0);

    if (!id || !title) { 
        alert("ID and Title fields cannot remain empty!"); 
        return; 
    }

    try {
        await updateDoc(doc(db, "tournaments", id), { title, banner, prize, entryFee, slots });
        alert("Success: Modifications Overwritten!");
        window.closeEditModal();
    } catch(err) { 
        alert("Execution Error: " + err.message); 
    }
};

// GLOBAL PIPELINE TERMINATION REF SYSTEM
window.terminatePipeline = async function(id) {
    if(confirm("Confirm action: Completely clear this tournament pipeline?")) {
        try { 
            await deleteDoc(doc(db, "tournaments", id)); 
            alert("Pipeline Ref Purged."); 
        } catch(err) { 
            alert("Purge Failed: " + err.message); 
        }
    }
};

// LEDGER OVERRIDE ENGINE SUBMIT HANDLER
document.getElementById('panel-wallet-override-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uid = document.getElementById('p-w-uid').value.trim();
    const coins = Math.max(0, parseInt(document.getElementById('p-w-coins').value, 10) || 0);
    
    if (!uid) { 
        alert("Targeted Player UID reference hash is missing."); 
        return; 
    }
    
    try {
        await setDoc(doc(db, "user_wallets", uid), { balance: coins }, { merge: true });
        alert("Ledger Injection Successful: Coins Updated!");
        document.getElementById('panel-wallet-override-form').reset();
    } catch(err) { 
        alert("Override Aborted: " + err.message); 
    }
});