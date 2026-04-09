import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, onValue, update, get, set } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// Config (Use your original)
const firebaseConfig = { ... };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentBalance = 0;
let timeLeft = 15;
let myBets = [];

// Sound Fix
const sndClick = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
const sndWin = new Audio('https://www.soundjay.com/human/sounds/applause-01.mp3');

onAuthStateChanged(auth, (user) => {
    if (user) {
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            const data = snap.val();
            currentBalance = data?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
            if(data?.kycVerified) {
                document.getElementById('v-status').innerHTML = '✅ Verified';
            }
        });
        startTimer();
    }
});

function startTimer() {
    let interval = setInterval(() => {
        if(timeLeft > 0) {
            document.getElementById('timer').innerText = timeLeft;
            timeLeft--;
        } else {
            clearInterval(interval);
            processGame();
        }
    }, 1000);
}

async function processGame() {
    const gameSnap = await get(ref(db, 'gameControl/nextResult'));
    let winner = gameSnap.val() || 'random';
    if(winner === 'random') winner = Math.random() > 0.5 ? 'tiger' : 'dragon';

    // Flip Card Animation
    const cardId = winner === 'tiger' ? 'card-tiger' : 'card-dragon';
    document.getElementById(cardId).classList.add('flipped');
    document.getElementById(cardId).innerText = Math.floor(Math.random() * 10) + 1;

    setTimeout(async () => {
        let totalWin = 0;
        myBets.forEach(b => { if(b.side === winner) totalWin += b.amount * 2; });

        if(totalWin > 0) {
            sndWin.play();
            await update(ref(db, `users/${auth.currentUser.uid}`), { balance: currentBalance + totalWin });
            Swal.fire("Winner!", "You Won PKR " + totalWin, "success");
        }

        // Reset
        setTimeout(() => {
            timeLeft = 15;
            myBets = [];
            document.querySelectorAll('.card-box').forEach(c => {
                c.classList.remove('flipped');
                c.innerText = "?";
            });
            startTimer();
        }, 3000);
    }, 1500);
}

window.placeBet = async (side) => {
    const amt = parseInt(document.getElementById('bet-amount').value);
    if(amt > currentBalance) return Swal.fire("Low Balance", "", "error");
    sndClick.play();
    myBets.push({side, amount: amt});
    await update(ref(db, `users/${auth.currentUser.uid}`), { balance: currentBalance - amt });
};
        
