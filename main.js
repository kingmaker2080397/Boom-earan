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

const sndClick = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
const sndWin = new Audio('https://www.soundjay.com/human/sounds/applause-01.mp3');

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        // Connect Balance
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            currentBalance = snap.val()?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
            document.getElementById('display-email').innerText = user.email.split('@')[0];
        });

        // Connect Admin Number
        onValue(ref(db, 'adminSettings/depositNumber'), (snap) => {
            const numElem = document.getElementById('admin-num');
            if(numElem) numElem.innerText = snap.val() || "Check Admin Panel";
        });

        // Share Link Generation
        const shareLink = `https://kingmaker2080397.github.io/Boom-earan/register.html?ref=${user.uid}`;
        document.getElementById('referral-link-input').value = shareLink;

        startTimer();
    } else { window.location.href = 'login.html'; }
});

function startTimer() {
    let interval = setInterval(() => {
        const timerElem = document.getElementById('timer');
        if(timeLeft > 0) {
            timerElem.innerText = timeLeft;
            timeLeft--;
        } else {
            clearInterval(interval);
            timerElem.innerText = "0";
            processResult();
        }
    }, 1000);
}

async function processResult() {
    canBet = false;
    const resDisplay = document.getElementById('result-display');
    resDisplay.innerText = "WAITING FOR RESULT...";

    // Admin Control Path
    const gameSnap = await get(ref(db, 'gameControl/nextResult'));
    let winner = gameSnap.val() || 'random';
    if(winner === 'random') winner = Math.random() > 0.5 ? 'tiger' : 'dragon';

    setTimeout(async () => {
        resDisplay.innerHTML = `WINNER: <span style="color:gold;">${winner.toUpperCase()}</span>`;
        
        let totalWin = 0;
        myActiveBets.forEach(bet => {
            if(bet.side === winner) totalWin += bet.amount * 2;
        });

        if(totalWin > 0) {
            sndWin.play();
            await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance + totalWin });
            Swal.fire("Winner!", "You Won " + totalWin + " PKR", "success");
        }

        setTimeout(() => {
            timeLeft = 15;
            canBet = true;
            myActiveBets = [];
            resDisplay.innerText = "PLACING BETS...";
            startTimer();
        }, 5000);
    }, 2000);
}

window.placeBet = async (side) => {
    if(!canBet) return;
    const amt = parseInt(document.getElementById('bet-amount').value);
    if(amt > currentBalance || amt < 10) return Swal.fire("Error", "Low Balance", "error");

    sndClick.play();
    myActiveBets.push({ side: side, amount: amt });
    await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance - amt });
};

window.copyShareLink = () => {
    const input = document.getElementById('referral-link-input');
    input.select();
    navigator.clipboard.writeText(input.value);
    Swal.fire("Copied!", "Share with friends to earn commission", "success");
};
    
