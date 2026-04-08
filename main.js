import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, onValue, update, get, set, push } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

let currentBalance = 0;
let currentUser = null;
let canBet = true;
let timeLeft = 15;
let myActiveBets = [];

// Sound Objects
const sndClick = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
const sndWin = new Audio('https://www.soundjay.com/human/sounds/applause-01.mp3');

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        // Balance Path Fix
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            currentBalance = snap.val()?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
            document.getElementById('display-email').innerText = user.email.split('@')[0];
        });

        // Admin Number Fetch (For Deposit Page)
        onValue(ref(db, 'adminConfig/depositNumber'), (snap) => {
            const numElem = document.getElementById('display-admin-number');
            if(numElem) numElem.innerText = snap.val() || "0300-0000000";
        });

        startTimer();
    } else { window.location.href = 'login.html'; }
});

// Game & Reward Logic
function startTimer() {
    let interval = setInterval(() => {
        const timerElem = document.getElementById('timer');
        if(timeLeft > 0) { timerElem.innerText = timeLeft; timeLeft--; }
        else { clearInterval(interval); timerElem.innerText = "0"; processResult(); }
    }, 1000);
}

async function processResult() {
    canBet = false;
    const resDisplay = document.getElementById('result-display');
    const gameSnap = await get(ref(db, 'gameControl/nextResult'));
    let winner = gameSnap.val() || 'random';
    if(winner === 'random') winner = Math.random() > 0.5 ? 'tiger' : 'dragon';

    resDisplay.innerHTML = `WINNER: ${winner.toUpperCase()}`;
    
    let totalWin = 0;
    myActiveBets.forEach(bet => { if(bet.side === winner) totalWin += bet.amount * 2; });

    if(totalWin > 0) {
        sndWin.play();
        await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance + totalWin });
        Swal.fire("Success", "You Won: " + totalWin, "success");
    }

    setTimeout(() => {
        timeLeft = 15; canBet = true; myActiveBets = [];
        resDisplay.innerText = "Betting Started!";
        startTimer();
    }, 5000);
}

window.placeBet = async (side) => {
    if(!canBet) return;
    const amt = parseInt(document.getElementById('bet-amount').value);
    if(amt > currentBalance || amt < 10) return Swal.fire("Error", "Balance Low", "error");
    
    sndClick.play();
    myActiveBets.push({ side: side, amount: amt });
    await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance - amt });
};
                     
