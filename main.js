import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, onValue, update, get, set, push } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyALm0SnUYjeeh4kJj9QBk4BgaINwnooa3c",
    authDomain: "boom-earnings.firebaseapp.com",
    databaseURL: "https://boom-earnings-default-rtdb.firebaseio.com",
    projectId: "boom-earnings",
    appId: "1:787871998344:web:3c20aa47e7e51001d01a3d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Global Variables
let currentBalance = 0;
let currentUser = null;
let canBet = true;

// 2. Auth & Balance Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        // User ka data aur balance fetch karein
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            const data = snap.val();
            currentBalance = data?.balance || 0;
            
            // Dashboard par balance update karein
            const balElem = document.getElementById('balance');
            if(balElem) balElem.innerText = currentBalance;
            
            const emailElem = document.getElementById('display-email');
            if(emailElem) emailElem.innerText = user.email.split('@')[0];
        });

        // Referral Link Generator
        const refLink = `https://kingmaker2080397.github.io/Boom-earan/register.html?ref=${user.uid}`;
        const refInput = document.getElementById('referral-link-input');
        if(refInput) refInput.value = refLink;

    } else {
        window.location.href = 'login.html';
    }
});

// 3. Trade/Bet Function
window.placeBet = async (side) => {
    if (!canBet) return Swal.fire("Sabar!", "Agla round shuru ho raha hai", "info");

    const betInput = document.getElementById('bet-amount');
    const amt = parseInt(betInput.value);

    if (isNaN(amt) || amt < 10) {
        return Swal.fire("Error", "Kam se kam 10 PKR likhein", "error");
    }

    if (amt > currentBalance) {
        return Swal.fire("Balance Kam Hai", "Pehle deposit karein", "warning");
    }

    try {
        // Balance deduct karein database se
        const newBalance = currentBalance - amt;
        await update(ref(db, `users/${currentUser.uid}`), { balance: newBalance });
        
        // Bet record karein (Admin ke liye)
        const betRef = push(ref(db, 'activeBets'));
        await set(betRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            side: side,
            amount: amt,
            timestamp: Date.now()
        });

        Swal.fire({
            title: "Bet Placed!",
            text: `${amt} PKR on ${side.toUpperCase()}`,
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });

    } catch (err) {
        Swal.fire("Error", "Trade nahi lagi: " + err.message, "error");
    }
};

// 4. Copy Referral Link Function
window.copyRefLink = () => {
    const copyText = document.getElementById("referral-link-input");
    if(!copyText || !copyText.value) return;
    
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    
    Swal.fire("Copied!", "Link doston ko bheinjein", "success");
};

// 5. Game Timer & Result Logic (Tiger vs Dragon)
function startTimer() {
    let timeLeft = 15;
    const timerElem = document.getElementById('timer');
    
    setInterval(() => {
        if(timerElem) timerElem.innerText = timeLeft;
        
        if (timeLeft <= 0) {
            canBet = false;
            // Result fetching logic yahan aayegi
            setTimeout(() => { timeLeft = 15; canBet = true; }, 5000);
        }
        timeLeft--;
    }, 1000);
}

startTimer();
        
