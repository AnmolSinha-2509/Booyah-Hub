// app.js - Optimized Client Engine with DocumentFragments, Proper SW Binding & Data Selectors
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, updateDoc, runTransaction, query, orderBy, limit, onSnapshot, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

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
let messaging = null;

try {
    messaging = getMessaging(app);
} catch (e) {
    console.warn("Push messaging nodes bypassed on localhost/non-ssl structures:", e.message);
}

// Memory tracking cleanup variables
let unsubscribeWallet = null;
let unsubscribeTournaments = null;
let unsubscribeChats = null;
let unsubscribeLeaderboard = null;
let unsubscribeNetwork = null;

let currentUserNode = null;

onAuthStateChanged(auth, async (user) => {
    const authWall = document.getElementById('auth-wall');
    
    if(unsubscribeWallet) { unsubscribeWallet(); unsubscribeWallet = null; }
    if(unsubscribeTournaments) { unsubscribeTournaments(); unsubscribeTournaments = null; }
    if(unsubscribeChats) { unsubscribeChats(); unsubscribeChats = null; }
    if(unsubscribeLeaderboard) { unsubscribeLeaderboard(); unsubscribeLeaderboard = null; }
    if(unsubscribeNetwork) { unsubscribeNetwork(); unsubscribeNetwork = null; }

    if (user) {
        currentUserNode = user;
        if(authWall) authWall.classList.add('hidden');
        
        await verifyAndInitializeUserWallet(user.uid);
        syncUserProfileHeader(user);
        listenToLiveTournaments();
        listenToGlobalChats();
        listenToLeaderboardRanks();
        listenToGamerNetworkFeed();
        initializePushNotificationPipeline();
    } else {
        currentUserNode = null;
        if(authWall) authWall.classList.remove('hidden');
    }
});

async function verifyAndInitializeUserWallet(uid) {
    const walletRef = doc(db, "user_wallets", uid);
    const snap = await getDoc(walletRef);
    
    if (!snap.exists()) {
        await setDoc(walletRef, { 
            balance: 100, 
            selectedAvatar: "avatar1",
            ign: "",
            freeFireUid: "",
            followers: [],
            following: []
        });
    } else {
        const data = snap.data();
        const ignInput = document.getElementById('profile-ign-field');
        const uidInput = document.getElementById('profile-uid-field');
        if(ignInput && data.ign) ignInput.value = data.ign;
        if(uidInput && data.freeFireUid) uidInput.value = data.freeFireUid;
    }

    unsubscribeWallet = onSnapshot(walletRef, (docSnap) => {
        if(docSnap.exists()) {
            const data = docSnap.data();
            const balNode = document.getElementById('user-coin-balance');
            const totalWalletNode = document.getElementById('wallet-total-balance');
            const followersNode = document.getElementById('global-followers-count');
            const followingNode = document.getElementById('global-following-count');
            
            if(balNode) balNode.innerText = data.balance !== undefined ? data.balance : 0;
            if(totalWalletNode) totalWalletNode.innerText = data.balance !== undefined ? data.balance : 0;
            if(followersNode) followersNode.innerText = data.followers ? data.followers.length : 0;
            if(followingNode) followingNode.innerText = data.following ? data.following.length : 0;
            
            highlightActiveAvatarUI(data.selectedAvatar || "avatar1");
        }
    });
}

function syncUserProfileHeader(user) {
    const nameNode = document.getElementById('user-display-name');
    const uidNode = document.getElementById('user-profile-uid');
    
    const fallbackName = (user && user.email) ? user.email.split('@')[0].toUpperCase() : "OPERATOR_NODE";
    if(nameNode) nameNode.innerText = user.displayName || fallbackName;
    if(uidNode) uidNode.innerText = user.uid;
}

function listenToLiveTournaments() {
    unsubscribeTournaments = onSnapshot(collection(db, "tournaments"), (snapshot) => {
        const feed = document.getElementById('live-tournaments-feed');
        if(!feed) return;
        feed.innerHTML = "";

        if(snapshot.empty) {
            feed.innerHTML = `<p class="text-xs text-gray-500 font-mono text-center py-8 uppercase tracking-wider">NO ACTIVE SCRIMS DETECTED.</p>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const id = docSnap.id;
            const t = docSnap.data();
            const registered = t.registeredPlayers ? t.registeredPlayers.length : 0;
            const isJoined = t.registeredPlayers?.includes(currentUserNode?.uid);
            const bannerImg = t.banner || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=500";

            const card = document.createElement('div');
            card.className = "bg-[#161922] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between";
            card.innerHTML = `
                <div class="relative h-32 bg-gray-900">
                    <img src="${bannerImg}" class="w-full h-full object-cover opacity-60" alt="Banner">
                    <span class="absolute top-3 right-3 bg-orange-600/90 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">FREE FIRE</span>
                </div>
                <div class="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="text-sm font-black uppercase tracking-wide text-white line-clamp-1">${t.title}</h4>
                        <p class="text-[10px] text-gray-500 font-mono mt-0.5">NODE_HASH: ${id}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-2 bg-[#0d0e12] border border-gray-800 p-2 rounded-xl text-center">
                        <div>
                            <span class="block text-[8px] text-gray-500 uppercase font-bold">Prize Pool</span>
                            <span class="text-xs font-extrabold text-amber-400">${t.prize} Coin</span>
                        </div>
                        <div>
                            <span class="block text-[8px] text-gray-500 uppercase font-bold">Entry Fee</span>
                            <span class="text-xs font-extrabold text-orange-500">${t.entryFee} Coin</span>
                        </div>
                        <div>
                            <span class="block text-[8px] text-gray-500 uppercase font-bold">Slots Left</span>
                            <span class="text-xs font-extrabold text-gray-300">${registered}/${t.slots}</span>
                        </div>
                    </div>
                    <button onclick="registerForScrimPipeline('${id}')" ${isJoined || registered >= t.slots ? 'disabled' : ''} class="w-full text-center py-2 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${isJoined ? 'bg-green-600/20 text-green-400 border border-green-500/30' : registered >= t.slots ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'gaming-gradient text-white shadow-lg shadow-orange-950/20 hover:scale-[1.01]' }">
                        ${isJoined ? 'Slot Reserved ✓' : registered >= t.slots ? 'Matrix Full' : 'Connect Pipeline'}
                    </button>
                </div>
            `;
            feed.appendChild(card);
        });
    });
}

window.registerForScrimPipeline = async function(tournamentId) {
    if(!currentUserNode) return;
    const userWalletRef = doc(db, "user_wallets", currentUserNode.uid);
    const tournamentRef = doc(db, "tournaments", tournamentId);

    try {
        await runTransaction(db, async (transaction) => {
            const userWalletSnap = await transaction.get(userWalletRef);
            const tournamentSnap = await transaction.get(tournamentRef);

            if (!userWalletSnap.exists() || !tournamentSnap.exists()) {
                throw new Error("Missing Identity Nodes.");
            }

            const userData = userWalletSnap.data();
            const tData = tournamentSnap.data();
            
            const currentBal = userData.balance !== undefined ? userData.balance : 0;
            const fee = tData.entryFee || 0;
            const registeredArr = tData.registeredPlayers || [];
            const maxSlots = tData.slots || 48;

            if (registeredArr.includes(currentUserNode.uid)) {
                throw new Error("Match registration already confirmed.");
            }
            if (registeredArr.length >= maxSlots) {
                throw new Error("Scrim server completely full.");
            }
            if (currentBal < fee) {
                throw new Error("Insufficient token balance.");
            }

            transaction.update(userWalletRef, { balance: currentBal - fee });
            transaction.update(tournamentRef, {
                registeredPlayers: arrayUnion(currentUserNode.uid)
            });
        });
        sendNotificationUI("Pipeline Secured! Match slot registered.", "success");
    } catch(err) {
        sendNotificationUI(err.message, "error");
    }
};

// FIXED: Implemented DocumentFragments to mitigate micro-stutter screen glitches on fast relays
function listenToGlobalChats() {
    const chatRef = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(40));
    unsubscribeChats = onSnapshot(chatRef, (snapshot) => {
        const box = document.getElementById('chat-messages-container');
        if(!box) return;
        
        const scrollOffsetThreshold = box.scrollHeight - box.scrollTop - box.clientHeight;

        const reverseArr = [];
        snapshot.forEach(d => reverseArr.unshift({id: d.id, data: d.data()}));

        if(reverseArr.length === 0) {
            box.innerHTML = `<p class="text-xs text-gray-600 text-center font-mono my-auto">Lobby empty. Transmit first payload telemetry node.</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        reverseArr.forEach(msgItem => {
            const m = msgItem.data;
            const isMe = m.senderUid === currentUserNode?.uid;
            
            const item = document.createElement('div');
            item.className = `flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'} space-y-0.5`;
            item.innerHTML = `
                <span class="text-[8px] text-gray-500 font-mono uppercase">${m.senderName || 'OPERATOR'}</span>
                <div class="p-2.5 rounded-2xl text-xs font-medium border ${isMe ? 'bg-orange-600/10 border-orange-500/30 text-orange-200 rounded-tr-none' : 'bg-[#161922] border-gray-800 text-gray-200 rounded-tl-none'}">
                    <p class="leading-relaxed break-all">${m.text}</p>
                </div>
            `;
            fragment.appendChild(item);
        });

        box.innerHTML = "";
        box.appendChild(fragment);

        if (scrollOffsetThreshold < 50) {
            box.scrollTop = box.scrollHeight;
        }
    });
}

document.getElementById('chat-send-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input-field');
    const txt = input.value.trim();
    if(!txt || !currentUserNode) return;

    try {
        const userFallback = (currentUserNode && currentUserNode.email) ? currentUserNode.email.split('@')[0].toUpperCase() : "OPERATOR";
        await addDoc(collection(db, "global_chat"), {
            text: txt,
            senderUid: currentUserNode.uid,
            senderName: currentUserNode.displayName || userFallback,
            timestamp: new Date()
        });
        input.value = "";
    } catch(e) { console.error(e); }
});

function listenToLeaderboardRanks() {
    const walletsQuery = query(collection(db, "user_wallets"), orderBy("balance", "desc"), limit(25));
    unsubscribeLeaderboard = onSnapshot(walletsQuery, (snapshot) => {
        const board = document.getElementById('leaderboard-ranking-feed');
        if(!board) return;
        board.innerHTML = "";

        let rankCounter = 1;
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const uidHash = docSnap.id;
            const shortUid = uidHash.substring(0, 8) + "...";
            const userBalance = data.balance !== undefined ? data.balance : 0;
            const displayName = data.ign ? data.ign : `OPERATOR_${shortUid.toUpperCase()}`;

            const row = document.createElement('div');
            row.className = "grid grid-cols-12 p-3 text-xs font-medium items-center text-center hover:bg-gray-900/40 transition-all";
            row.innerHTML = `
                <span class="col-span-2 font-mono font-black ${rankCounter === 1 ? 'text-amber-400' : rankCounter === 2 ? 'text-slate-400' : rankCounter === 3 ? 'text-amber-700' : 'text-gray-500'}">#${rankCounter}</span>
                <div class="col-span-7 text-left pl-2 flex items-center gap-2">
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${data.selectedAvatar || 'avatar1'}" class="w-5 h-5 rounded-md bg-gray-800" alt="av">
                    <span class="font-bold text-gray-200 uppercase tracking-wide truncate max-w-[150px]">${displayName}</span>
                </div>
                <span class="col-span-3 font-mono font-black text-amber-500">${userBalance}</span>
            `;
            board.appendChild(row);
            rankCounter++;
        });
    });
}

function listenToGamerNetworkFeed() {
    unsubscribeNetwork = onSnapshot(collection(db, "user_wallets"), (snapshot) => {
        const container = document.getElementById('roblox-social-feed-container');
        if(!container) return;
        container.innerHTML = "";

        let operatorsRendered = 0;
        snapshot.forEach((docSnap) => {
            const targetUid = docSnap.id;
            if(targetUid === currentUserNode?.uid) return; 

            const data = docSnap.data();
            const shortUid = targetUid.substring(0,6).toUpperCase();
            const displayName = data.ign ? data.ign : `OP_${shortUid}`;
            const followersList = data.followers || [];
            const isFollowing = followersList.includes(currentUserNode?.uid);

            const bubble = document.createElement('div');
            bubble.className = "flex flex-col items-center p-2.5 bg-[#0d0e12] border border-gray-800 rounded-xl min-w-[90px] space-y-1.5 text-center shrink-0";
            bubble.innerHTML = `
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${data.selectedAvatar || 'avatar1'}" class="w-8 h-8 bg-gray-900 border border-gray-800 rounded-lg" alt="av">
                <span class="text-[9px] font-black uppercase tracking-tight max-w-[75px] truncate text-gray-300">${displayName}</span>
                <button onclick="toggleFollowOperator('${targetUid}', ${isFollowing})" class="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all ${isFollowing ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}">
                    ${isFollowing ? 'Linked' : 'Link'}
                </button>
            `;
            container.appendChild(bubble);
            operatorsRendered++;
        });

        if(operatorsRendered === 0) {
            container.innerHTML = `<p class="text-[9px] text-gray-600 font-mono py-1 uppercase">No other dynamic nodes detected in network bounds.</p>`;
        }
    });
}

window.toggleFollowOperator = async function(targetUid, isFollowing) {
    if(!currentUserNode) return;
    const myWalletRef = doc(db, "user_wallets", currentUserNode.uid);
    const targetWalletRef = doc(db, "user_wallets", targetUid);

    try {
        if(isFollowing) {
            await updateDoc(myWalletRef, { following: arrayRemove(targetUid) });
            await updateDoc(targetWalletRef, { followers: arrayRemove(currentUserNode.uid) });
            sendNotificationUI("Identity matrix node linkage decoupled.", "success");
        } else {
            await updateDoc(myWalletRef, { following: arrayUnion(targetUid) });
            await updateDoc(targetWalletRef, { followers: arrayUnion(currentUserNode.uid) });
            sendNotificationUI("Identity matrix network linked!", "success");
        }
    } catch(err) {
        console.error(err);
        sendNotificationUI("Failed to alter directory arrays.", "error");
    }
};

window.updateGamerProfileNode = async function() {
    if(!currentUserNode) return;
    const ign = document.getElementById('profile-ign-field').value.trim();
    const ffUid = document.getElementById('profile-uid-field').value.trim();
    
    if(!ign || !ffUid) {
        sendNotificationUI("All configurations parameters are mandatory.", "error");
        return;
    }

    try {
        await updateDoc(doc(db, "user_wallets", currentUserNode.uid), { ign: ign, freeFireUid: ffUid });
        sendNotificationUI("Gamer Registry Matrix Overwritten!", "success");
    } catch(err) {
        sendNotificationUI("Failed to store profiles metadata settings.", "error");
    }
};

window.selectProfileAvatarMatrix = async function(avatarId) {
    if(!currentUserNode) return;
    try {
        await updateDoc(doc(db, "user_wallets", currentUserNode.uid), { selectedAvatar: avatarId });
        sendNotificationUI("Identity Avatar Profile Modified!", "success");
    } catch(err) { console.error(err); }
};

// FIXED: Migrated selection pattern directly into clean and definitive HTML5 dataset attributes filters
function highlightActiveAvatarUI(avatarId) {
    document.querySelectorAll('.avatar-option').forEach(el => {
        el.classList.remove('active-avatar', 'border-orange-500');
        if(el.getAttribute('data-avatar') === avatarId) {
            el.classList.add('active-avatar', 'border-orange-500');
        }
    });
}

// FIXED: Corrected token delivery mapping options via explicitly assigned native serviceWorker registrations
function initializePushNotificationPipeline() {
    if (!messaging) return;
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then((registration) => {
                    return getToken(messaging, { serviceWorkerRegistration: registration });
                })
                .then((currentToken) => { 
                    if (currentToken) console.log("Messaging network registry success token: ", currentToken); 
                })
                .catch((err) => { console.error("FCM Token compilation drop error: ", err); });
        }
    });
    onMessage(messaging, (payload) => {
        sendNotificationUI(payload.notification.body || "Incoming Arena Broadcast!", "success");
    });
}

function sendNotificationUI(msg, type = "success") {
    const container = document.getElementById('toast-notification-zone');
    if(!container) return;

    const div = document.createElement('div');
    div.className = `p-3 rounded-xl border text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 animate-fadeIn transition-all duration-300 ${type === 'success' ? 'bg-green-950/80 border-green-500 text-green-400' : 'bg-red-950/80 border-red-500 text-red-400'}`;
    div.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> <span>${msg}</span>`;
    
    container.appendChild(div);
    setTimeout(() => { div.remove(); }, 4000);
}

window.switchTab = function(tabId) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.add('hidden'));
    document.querySelectorAll('.nav-link-mobile').forEach(btn => btn.classList.remove('active-nav'));
    
    const targetView = document.getElementById(`view-${tabId}`);
    if(targetView) targetView.classList.remove('hidden');
    
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if(activeBtn) activeBtn.classList.add('active-nav');
};

document.getElementById('gate-login-trigger')?.addEventListener('click', () => {
    const email = document.getElementById('auth-email-node').value.trim();
    const pass = document.getElementById('auth-password-node').value;
    if(email && pass) signInWithEmailAndPassword(auth, email, pass).catch(e => sendNotificationUI(e.message, "error"));
});

document.getElementById('gate-register-trigger')?.addEventListener('click', () => {
    const email = document.getElementById('auth-email-node').value.trim();
    const pass = document.getElementById('auth-password-node').value;
    if(email && pass) createUserWithEmailAndPassword(auth, email, pass).catch(e => sendNotificationUI(e.message, "error"));
});

document.getElementById('wall-google-login')?.addEventListener('click', () => {
    signInWithPopup(auth, new GoogleAuthProvider()).catch(e => sendNotificationUI(e.message, "error"));
});

document.getElementById('master-logout-node')?.addEventListener('click', () => { signOut(auth); });