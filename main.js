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
let myActiveBets = []; // Saari trades yahan save hongi

// Audio
const sndClick = document.getElementById('snd-click');
const sndWin = document.getElementById('snd-win');
const sndTick = document.getElementById('snd-tick');

// Auth Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            currentBalance = snap.val()?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
            document.getElementById('display-email').innerText = user.email.split('@')[0];
        });
        document.getElementById('referral-link-input').value = `https://kingmaker2080397.github.io/Boom-earan/register.html?ref=${user.uid}`;
        startTimer();
    } else {
        window.location.href = 'login.html';
    }
});

// Timer Logic
function startTimer() {
    let interval = setInterval(() => {
        const timerElem = document.getElementById('timer');
        if(timeLeft > 0) {
            timerElem.innerText = timeLeft;
            if(timeLeft <= 5) sndTick.play();
            timeLeft--;
        } else {
            clearInterval(interval);
            timerElem.innerText = "0";
            showResult();
        }
    }, 1000);
}

// Result & Multiple Reward Calculation
async function showResult() {
    canBet = false;
    const resDisplay = document.getElementById('result-display');
    resDisplay.innerText = "Checking Result...";

    // Get Admin Result
    const gameSnap = await get(ref(db, 'gameControl/nextResult'));
    let winner = gameSnap.val() || 'random';
    if(winner === 'random') winner = Math.random() > 0.5 ? 'tiger' : 'dragon';

    setTimeout(async () => {
        resDisplay.innerHTML = `WINNER: <span style="color:gold;">${winner.toUpperCase()}</span>`;
        
        // Reward for ALL active bets
        let totalWin = 0;
        myActiveBets.forEach(bet => {
            if(bet.side === winner) {
                totalWin += bet.amount * 2;
            }
        });

        if(totalWin > 0) {
            sndWin.play();
            await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance + totalWin });
            Swal.fire("Winner!", `Total Reward: ${totalWin} PKR`, "success");
        }

        // Reset for next round
        setTimeout(() => {
            timeLeft = 15;
            canBet = true;
            myActiveBets = []; // Bets khali
            resDisplay.innerText = "Betting Started!";
            startTimer();
        }, 5000);
    }, 2000);
}

// Bet Function
window.placeBet = async (side) => {
    if(!canBet) return Swal.fire("Closed", "Wait for next round", "info");
    const amt = parseInt(document.getElementById('bet-amount').value);

    if(amt > currentBalance || amt < 10) return Swal.fire("Error", "Insufficient Balance", "error");

    sndClick.play();
    myActiveBets.push({ side: side, amount: amt }); // List mein add karein
    
    await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance - amt });
    Swal.fire({ title: "Bet Placed", text: `${amt} on ${side}`, icon: "success", timer: 800, showConfirmButton: false });
};

window.copyRefLink = () => {
    const input = document.getElementById('referral-link-input');
    input.select();
    navigator.clipboard.writeText(input.value);
    Swal.fire("Copied!", "Link shared", "success");
};
                       
