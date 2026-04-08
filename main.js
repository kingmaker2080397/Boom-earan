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
let currentBet = null; // User ki bet store karne ke liye

onAuthStateChanged(auth, (user) => {
    if (!user) { location.href = 'login.html'; }
    else {
        document.getElementById('display-email').innerText = user.email.split('@')[0];
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            currentBalance = snap.val()?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
        });
        startTimer();
        startFakePayouts();
    }
});

function startTimer() {
    setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
        } else {
            // Jab Timer 0 ho jaye
            showResult(); 
            timeLeft = 15; // Reset timer
            canBet = true;
        }

        if (timeLeft <= 3) { 
            canBet = false; // Last 3 seconds mein bet band
        }

        document.getElementById('timer-sec').innerText = timeLeft;
        
        // Naye round ki shuruat mein cards hide karo
        if (timeLeft === 14) {
            document.getElementById('card-t').innerText = "?";
            document.getElementById('card-d').innerText = "?";
            currentBet = null;
        }
    }, 1000);
}

// Ye function timer khatam hone par chalega
async function showResult() {
    let t = Math.floor(Math.random() * 13) + 1;
    let d = Math.floor(Math.random() * 13) + 1;
    
    // Cards show karo
    document.getElementById('card-t').innerText = t;
    document.getElementById('card-d').innerText = d;

    if (currentBet) {
        let win = (t > d && currentBet.side === 'tiger') || (d > t && currentBet.side === 'dragon');
        let finalAmount = win ? currentBalance + currentBet.amount : currentBalance - currentBet.amount;
        
        // Database update
        await update(ref(db, `users/${auth.currentUser.uid}`), { balance: finalAmount });
        
        // Result display
        showSticker(win ? 'win' : 'loss');
    }
}

window.placeBet = (side) => {
    if (!canBet) return alert("Betting Closed! Wait for next round.");
    if (currentBet) return alert("Already placed a bet!");

    const amt = parseInt(document.getElementById('bet-amount').value);
    if (amt < 10 || amt > currentBalance) return alert("Invalid Balance!");

    // Sirf bet note karo, result timer khatam hone par aayega
    currentBet = { side: side, amount: amt };
    alert("Bet Placed on " + side.toUpperCase() + "! Waiting for result...");
};

function showSticker(type) {
    const div = document.createElement('div');
    div.style = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1000;background:rgba(0,0,0,0.9);padding:30px;border-radius:20px;border:2px solid gold;text-align:center;";
    div.innerHTML = `<h1>${type === 'win' ? 'WIN! 🎉' : 'LOSS ❌'}</h1>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function startFakePayouts() {
    const names = ["Malik", "Kashif", "Sana", "Zeeshan", "Ali"];
    setInterval(() => {
        const toast = document.getElementById('payout-toast');
        if(toast){
            toast.style.bottom = "20px";
            document.getElementById('toast-text').innerText = `🎊 ${names[Math.floor(Math.random()*5)]} won RS ${Math.floor(Math.random()*2000)+100}`;
            setTimeout(() => toast.style.bottom = "-100px", 4000);
        }
    }, 10000);
            }
    
