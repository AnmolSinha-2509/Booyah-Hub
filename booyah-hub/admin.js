// admin.js - Fully Sanitized Production Framework with Explicit Scope Bindings
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

onAuthStateChanged(auth, (user) => {
    const wall = document.getElementById('admin-auth-wall');
    if (user && user.email === "admin@booyahhub.com") {
        if(wall) wall.style.display = "none";
        syncAdminTournamentsPanel();
    } else {
        if(wall) wall.style.display = "flex";
        if(unsubscribeAdminTournaments) unsubscribeAdminTournaments();
    }
});

// Submit Form logic
document.getElementById('terminal-auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-password').value;
    const err = document.getElementById('auth-err-msg');

    if(err) err.style.display = "none";

    if(email !== "admin@booyahhub.com") {
        if(err) { err.style.display="block"; err.innerText="ACCESS DENIED: Insufficient Node Authorization."; }
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch(error) {
        if(err) { err.style.display="block"; err.innerText="CRITICAL AUTH FAILURE: " + error.message; }
    }
});

// Tournament injection
document.getElementById('panel-creation-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('p-title').value.trim();
    const banner = document.getElementById('p-banner').value.trim();
    const prize = parseInt(document.getElementById('p-prize').value, 10) || 0;
    const entryFee = parseInt(document.getElementById('p-fee').value, 10) || 0;
    const slots = parseInt(document.getElementById('p-slots').value, 10) || 48;

    try {
        await addDoc(collection(db, "tournaments"), { title, banner, prize, entryFee, slots, players: [] });
        alert("Deployment Packet Transmitted Successfully.");
        e.target.reset();
    } catch(err) {
        alert("Transmission Failed: " + err.message);
    }
});

function syncAdminTournamentsPanel() {
    unsubscribeAdminTournaments = onSnapshot(collection(db, "tournaments"), (snapshot) => {
        const wrapper = document.getElementById('admin-tournaments-wrapper');
        if(!wrapper) return;
        wrapper.innerHTML = "";

        snapshot.forEach(matchDoc => {
            const data = matchDoc.data();
            const players = data.players || [];
            wrapper.innerHTML += `
                <div class="bg-[#14161f] border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h4 class="text-sm font-black uppercase text-white">${data.title}</h4>
                        <p class="text-[11px] text-gray-400 mt-1">Prize: 💎 ${data.prize} | Fee: 💎 ${data.entryFee} | Registry: ${players.length}/${data.slots}</p>
                    </div>
                    <div class="flex gap-2 w-full md:w-auto">
                        <button onclick="openEditModal('${matchDoc.id}', '${data.title}', '${data.banner || ""}', ${data.prize}, ${data.entryFee}, ${data.slots})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase">Edit</button>
                        <button onclick="terminatePipeline('${matchDoc.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase">Purge</button>
                    </div>
                </div>
            `;
        });
    });
}

window.saveTournamentEdits = async function() {
    const id = document.getElementById('edit-t-id').value;
    const title = document.getElementById('edit-t-title').value.trim();
    const banner = document.getElementById('edit-t-banner').value.trim();
    const prize = parseInt(document.getElementById('edit-t-prize').value, 10) || 0;
    const entryFee = parseInt(document.getElementById('edit-t-fee').value, 10) || 0;
    const slots = parseInt(document.getElementById('edit-t-slots').value, 10) || 48;

    if(!id || !title) { alert("ID and Title fields cannot remain empty!"); return; }

    try {
        await updateDoc(doc(db, "tournaments", id), { title, banner, prize, entryFee, slots });
        alert("Success: Modifications Overwritten!");
        window.closeEditModal();
    } catch(err) { alert("Execution Error: " + err.message); }
};

window.terminatePipeline = async function(id) {
    if(confirm("Confirm action: Completely clear this tournament pipeline?")) {
        try { await deleteDoc(doc(db, "tournaments", id)); alert("Pipeline Ref Purged."); } 
        catch(err) { alert("Purge Failed: " + err.message); }
    }
};

document.getElementById('panel-wallet-override-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uid = document.getElementById('p-w-uid').value.trim();
    const coins = Math.max(0, parseInt(document.getElementById('p-w-coins').value, 10) || 0);
    
    if (!uid) { alert("Targeted Player UID reference hash is missing."); return; }
    
    try {
        await setDoc(doc(db, "wallets", uid), { diamonds: coins }, { merge: true });
        alert("Ledger Injection Successful: Coins Updated!");
        document.getElementById('panel-wallet-override-form').reset();
    } catch(err) { alert("Override Aborted: " + err.message); }
});