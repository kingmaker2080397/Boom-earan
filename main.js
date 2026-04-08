import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyALm0SnUYjeeh4kJj9QBk4BgaINwnooa3c",
    authDomain: "boom-earnings.firebaseapp.com",
    databaseURL: "https://boom-earnings-default-rtdb.firebaseio.com",
    projectId: "boom-earnings",
    storageBucket: "boom-earnings.firebasestorage.app",
    appId: "1:787871998344:web:3c20aa47e7e51001d01a3d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentBalance = 0;
let canBet = true;
let timeLeft = 15;

onAuthStateChanged(auth, (user) => {
    if (!user) { location.href = 'login.html'; }
    else {
        document.getElementById('display-email').innerText = user.email.split('@')[0];
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            currentBalance = snap.val()?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
        });
        startTimer();
    }
});

function startTimer() {
    setInterval(() => {
        if (timeLeft <= 0) {
            timeLeft = 15;
            canBet = true;
            document.getElementById('card-t').innerText = "?";
            document.getElementById('card-d').innerText = "?";
        }
        if (timeLeft === 3) { canBet = false; }
        document.getElementById('timer-sec').innerText = timeLeft;
        timeLeft--;
    }, 1000);
}

window.placeBet = async (side) => {
    if (!canBet) return alert("Wait for next round!");
    const amt = parseInt(document.getElementById('bet-amount').value);
    if (amt < 10 || amt > currentBalance) return alert("Invalid Balance!");
    
    document.getElementById('bg-music').play().catch(()=>{});

    let t = Math.floor(Math.random() * 13) + 1;
    let d = Math.floor(Math.random() * 13) + 1;
    document.getElementById('card-t').innerText = t;
    document.getElementById('card-d').innerText = d;

    let win = (t > d && side === 'tiger') || (d > t && side === 'dragon');
    let newBal = win ? currentBalance + amt : currentBalance - amt;

    await update(ref(db, `users/${auth.currentUser.uid}`), { balance: newBal });
    
    const status = win ? "WIN! 🎉" : "LOSS ❌";
    const div = document.createElement('div');
    div.style = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:30px;border-radius:15px;border:2px solid gold;z-index:100";
    div.innerHTML = `<h1>${status}</h1>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
};
        
