import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// AAPKA CONFIG DARJ HAI
const firebaseConfig = {
    apiKey: "AIzaSyALm0SnUYjeeh4kJj9QBk4BgaINwnooa3c",
    authDomain: "boom-earnings.firebaseapp.com",
    databaseURL: "https://boom-earnings-default-rtdb.firebaseio.com",
    projectId: "boom-earnings",
    storageBucket: "boom-earnings.firebasestorage.app",
    messagingSenderId: "787871998344",
    appId: "1:787871998344:web:3c20aa47e7e51001d01a3d",
    measurementId: "G-MNGM4NSP7J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Check Login Status
onAuthStateChanged(auth, (user) => {
    if (!user) { location.href = 'login.html'; }
    else { 
        document.getElementById('display-email').innerText = user.email.split('@')[0];
        onValue(ref(db, `users/${user.uid}`), (s) => {
            const bal = s.val()?.balance || 0;
            document.getElementById('balance').innerText = bal;
            updateLeaderboard(bal);
        });
        startFakePayouts();
    }
});

// Play Game Logic
window.play = async (side) => {
    const amt = parseInt(document.getElementById('bet-amount').value);
    if (amt < 10 || amt > 500) return alert("Limit: 10 - 500 PKR");
    
    const uid = auth.currentUser.uid;
    const userSnap = await get(ref(db, `users/${uid}`));
    let bal = userSnap.val().balance;
    if (amt > bal) return alert("Balance Low! Deposit Karein.");

    // Admin Control Setting Check
    const mode = (await get(ref(db, 'game_control/winner'))).val() || "random";
    let t, d;
    if(mode === "tiger") { t = 13; d = 1; }
    else if(mode === "dragon") { d = 13; t = 1; }
    else { t = Math.floor(Math.random()*13)+1; d = Math.floor(Math.random()*13)+1; }

    document.getElementById('card-t').innerText = t;
    document.getElementById('card-d').innerText = d;

    let win = (t > d && side === 'tiger') || (d > t && side === 'dragon');
    let newBal = win ? bal + amt : bal - amt;
    
    await update(ref(db, `users/${uid}`), { balance: newBal });
    showSticker(win ? 'win' : 'loss');
};

function showSticker(type) {
    const img = type === 'win' ? 'https://cdn-icons-png.flaticon.com/512/5995/5995357.png' : 'https://cdn-icons-png.flaticon.com/512/10008/10008083.png';
    const div = document.createElement('div');
    div.style = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99;background:rgba(0,0,0,0.9);padding:30px;border-radius:20px;text-align:center;border:2px solid gold";
    div.innerHTML = `<img src="${img}" width="120"><h1>${type === 'win' ? 'YOU WIN!' : 'LOST!'}</h1>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

function startFakePayouts() {
    const names = ["Rahul", "Ali", "Sana", "Kashif", "Zeeshan", "Hamza", "Ayesha"];
    const cities = ["Lahore", "Karachi", "Pindi", "Multan"];
    setInterval(() => {
        const toast = document.getElementById('payout-toast');
        toast.style.bottom = "20px";
        document.getElementById('toast-text').innerText = `${names[Math.floor(Math.random()*7)]} from ${cities[Math.floor(Math.random()*4)]} withdrew RS ${Math.floor(Math.random()*5000)+300}`;
        setTimeout(() => toast.style.bottom = "-100px", 4000);
    }, 12000);
}

function updateLeaderboard(ub) {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = `<div class="lb-row" style="color:gold; font-weight:bold;"><span>1. YOU (Live)</span><span>RS ${ub}</span></div>` +
    `<div class="lb-row"><span>2. Malik_Don</span><span>RS 68,400</span></div>` +
    `<div class="lb-row"><span>3. Prince_Lahore</span><span>RS 52,100</span></div>` +
    `<div class="lb-row"><span>4. King_Trader</span><span>RS 41,000</span></div>`;
          }
                                                 
