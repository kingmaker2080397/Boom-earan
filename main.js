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
let myBet = null;

// Audio Elements
const sndClick = document.getElementById('sound-click');
const sndWin = document.getElementById('sound-win');
const sndTimer = document.getElementById('sound-timer');

// --- User & Balance ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            currentBalance = snap.val()?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
            document.getElementById('display-email').innerText = "Hi, " + user.email.split('@')[0];
        });
        
        // Referral Link
        const refLink = `https://kingmaker2080397.github.io/Boom-earan/register.html?ref=${user.uid}`;
        document.getElementById('referral-link-input').value = refLink;
        
        startTimer(); // Game Start
    } else {
        window.location.href = 'login.html';
    }
});

// --- Timer & Game Logic ---
function startTimer() {
    let timerInterval = setInterval(() => {
        const timerElem = document.getElementById('timer');
        const resDisplay = document.getElementById('result-display');

        if(timeLeft > 0) {
            timerElem.innerText = timeLeft;
            if(timeLeft <= 5) sndTimer.play(); // Last 5 seconds sound
            timeLeft--;
        } else {
            clearInterval(timerInterval);
            timerElem.innerText = "0";
            showResult();
        }
    }, 1000);
}

async function showResult() {
    canBet = false;
    const resDisplay = document.getElementById('result-display');
    resDisplay.innerText = "Checking Cards...";

    // Admin control check
    const gameSnap = await get(ref(db, 'gameControl/nextResult'));
    let winner = gameSnap.val() || 'random';
    if(winner === 'random') winner = Math.random() > 0.5 ? 'tiger' : 'dragon';

    setTimeout(async () => {
        resDisplay.innerHTML = `WINNER: <span style="color:gold;">${winner.toUpperCase()}</span>`;
        if(myBet && myBet.side === winner) {
            sndWin.play();
            const winAmt = myBet.amount * 2;
            await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance + winAmt });
            Swal.fire("You Won!", `+${winAmt} PKR`, "success");
        }
        
        // Reset game after 5 seconds
        setTimeout(() => {
            timeLeft = 15;
            myBet = null;
            canBet = true;
            resDisplay.innerText = "Betting Started!";
            startTimer();
        }, 5000);
    }, 2000);
}

// --- Bet Function ---
window.placeBet = async (side) => {
    if(!canBet) return Swal.fire("Wait", "Round ended", "info");
    
    const amt = parseInt(document.getElementById('bet-amount').value);
    if(amt > currentBalance || amt < 10) return Swal.fire("Error", "Invalid Balance", "error");

    sndClick.play();
    myBet = { side: side, amount: amt };
    await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance - amt });
    
    Swal.fire({ title: "Bet Placed", text: side.toUpperCase(), icon: "success", timer: 1000, showConfirmButton: false });
};

// --- Copy Function ---
window.copyRefLink = () => {
    const copyText = document.getElementById("referral-link-input");
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    Swal.fire("Copied", "Link shared!", "success");
};
        
