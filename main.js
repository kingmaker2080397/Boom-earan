import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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
let canBet = true;
let timeLeft = 15;
let myPendingBet = null;

// LOGIN SESSION FIX - Har page par check karega
onAuthStateChanged(auth, (user) => {
    if (!user) {
        if(!window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
            window.location.href = 'login.html';
        }
    } else {
        document.getElementById('display-email').innerText = user.email.split('@')[0];
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            currentBalance = snap.val()?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
        });
        startTimer();
    }
});

function startTimer() {
    setInterval(async () => {
        if (timeLeft > 0) {
            timeLeft--;
        } else {
            await processResult();
            timeLeft = 15;
            canBet = true;
        }
        if (document.getElementById('timer-sec')) document.getElementById('timer-sec').innerText = timeLeft;
        if (timeLeft <= 3) canBet = false;
        if (timeLeft === 14) {
            document.getElementById('card-t').innerText = "?";
            document.getElementById('card-d').innerText = "?";
            myPendingBet = null;
        }
    }, 1000);
}

async function processResult() {
    // 1. Get Admin Setting
    const controlSnap = await get(ref(db, 'gameControl'));
    const mode = controlSnap.val()?.nextResult || 'random';
    
    let t, d;
    if(mode === 'tiger') { t = 13; d = 2; } // Force Tiger Win
    else if(mode === 'dragon') { d = 13; t = 2; } // Force Dragon Win
    else { t = Math.floor(Math.random()*13)+1; d = Math.floor(Math.random()*13)+1; }

    document.getElementById('card-t').innerText = t;
    document.getElementById('card-d').innerText = d;

    if(myPendingBet) {
        let win = (t > d && myPendingBet.side === 'tiger') || (d > t && myPendingBet.side === 'dragon');
        let newBal = win ? currentBalance + myPendingBet.amount : currentBalance - myPendingBet.amount;
        await update(ref(db, `users/${auth.currentUser.uid}`), { balance: newBal });
        
        // SweetAlert Result
        Swal.fire({ title: win ? 'WIN! 🎉' : 'LOSS ❌', background: '#111', color: 'gold', timer: 3000, showConfirmButton: false });
    }
    
    // Reset admin setting to random after use
    await update(ref(db, 'gameControl'), { nextResult: 'random' });
}

window.placeBet = (side) => {
    if(!canBet) return Swal.fire({title: 'Wait!', text: 'Round starting soon', icon: 'warning'});
    const amt = parseInt(document.getElementById('bet-amount').value);
    if(amt > currentBalance || isNaN(amt)) return alert("Low Balance!");
    myPendingBet = { side: side, amount: amt };
    Swal.fire({title: 'Bet Placed!', icon: 'success', timer: 1000, showConfirmButton: false});
};
    
