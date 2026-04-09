import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, onValue, update, get, set } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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
let timeLeft = 15;
let myBets = [];

// Sound Effects
const sndBet = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
const sndWin = new Audio('https://www.soundjay.com/human/sounds/applause-01.mp3');

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            currentBalance = snap.val()?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
        });
        startTimer();
    } else { window.location.href = 'login.html'; }
});

function startTimer() {
    let interval = setInterval(() => {
        if(timeLeft > 0) {
            document.getElementById('timer').innerText = timeLeft;
            timeLeft--;
        } else {
            clearInterval(interval);
            showResult();
        }
    }, 1000);
}

async function showResult() {
    const status = document.getElementById('status');
    const gameSnap = await get(ref(db, 'gameControl/nextResult'));
    let winner = gameSnap.val() || 'random';
    if(winner === 'random') winner = Math.random() > 0.5 ? 'tiger' : 'dragon';

    // Animation
    const card = document.getElementById(`card-${winner}`);
    card.classList.add('flipped');

    setTimeout(async () => {
        status.innerText = `${winner.toUpperCase()} WINS!`;
        let winnings = 0;
        myBets.forEach(b => { if(b.side === winner) winnings += b.amount * 2; });

        if(winnings > 0) {
            sndWin.play();
            await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance + winnings });
            Swal.fire("Winner!", `+${winnings} PKR added`, "success");
        }

        setTimeout(() => {
            timeLeft = 15; myBets = [];
            document.querySelectorAll('.card-inner').forEach(c => c.classList.remove('flipped'));
            status.innerText = "Betting Open";
            startTimer();
        }, 4000);
    }, 1000);
}

window.placeBet = async (side) => {
    const amt = parseInt(document.getElementById('bet-amount').value);
    if(amt > currentBalance) return Swal.fire("Error", "Insufficient Balance", "error");
    
    sndBet.play();
    myBets.push({ side, amount: amt });
    await update(ref(db, `users/${currentUser.uid}`), { balance: currentBalance - amt });
};
    
