import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyALm0SnUYjeeh4kJj9QBk4BgaINwnooa3c",
    authDomain: "boom-earnings.firebaseapp.com",
    databaseURL: "https://boom-earnings-default-rtdb.firebaseio.com",
    projectId: "boom-earnings",
    storageBucket: "boom-earnings.firebasestorage.app",
    messagingSenderId: "787871998344",
    appId: "1:787871998344:web:3c20aa47e7e51001d01a3d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentBalance = 0;
let canBet = true;
let timeLeft = 15;

// Auth State
onAuthStateChanged(auth, (user) => {
    if (!user) {
        location.href = 'login.html';
    } else {
        document.getElementById('display-email').innerText = user.email.split('@')[0];
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            currentBalance = snap.val()?.balance || 0;
            document.getElementById('balance').innerText = currentBalance;
        });
        startTimer();
        startFakePayouts();
    }
});

// Timer Logic
function startTimer() {
    setInterval(async () => {
        if (timeLeft <= 0) {
            timeLeft = 15;
            canBet = true;
            resetTable();
        }
        if (timeLeft === 3) {
            canBet = false; // Stop betting in last 3 seconds
        }
        document.getElementById('timer-sec').innerText = timeLeft;
        timeLeft--;
    }, 1000);
}

function resetTable() {
    document.getElementById('card-t').innerText = "?";
    document.getElementById('card-d').innerText = "?";
}

// Game Result Music & Sounds
const winSound = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
const lossSound = new Audio('https://www.soundjay.com/button/sounds/button-10.mp3');

window.placeBet = async (side) => {
    if (!canBet) return alert("Wait for next round!");
    
    const amt = parseInt(document.getElementById('bet-amount').value);
    if (amt < 10 || amt > currentBalance) return alert("Invalid Amount or Low Balance!");

    // Start background music on first click (Browser policy)
    document.getElementById('bg-music').play().catch(()=>{});

    // Random Cards (Admin Control can be added here)
    let t = Math.floor(Math.random() * 13) + 1;
    let d = Math.floor(Math.random() * 13) + 1;
    if(t === d) t++; // Avoid Tie for simple logic

    document.getElementById('card-t').innerText = t;
    document.getElementById('card-d').innerText = d;

    let win = (t > d && side === 'tiger') || (d > t && side === 'dragon');
    let newBal = win ? currentBalance + amt : currentBalance - amt;

    await update(ref(db, `users/${auth.currentUser.uid}`), { balance: newBal });
    
    if(win) winSound.play(); else lossSound.play();
    showSticker(win ? 'win' : 'loss');
};

function showSticker(type) {
    const img = type === 'win' ? 'https://cdn-icons-png.flaticon.com/512/5995/5995357.png' : 'https://cdn-icons-png.flaticon.com/512/10008/10008083.png';
    const div = document.createElement('div');
    div.style = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1000;background:rgba(0,0,0,0.9);padding:30px;border-radius:20px;border:2px solid gold;text-align:center;";
    div.innerHTML = `<img src="${img}" width="120"><h1>${type === 'win' ? 'JACKPOT WIN!' : 'BET LOST'}</h1>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
}

function startFakePayouts() {
    const names = ["Malik", "Kashif", "Sana", "Zeeshan", "Ali"];
    setInterval(() => {
        const toast = document.getElementById('payout-toast');
        toast.style.bottom = "20px";
        document.getElementById('toast-text').innerText = `🎊 ${names[Math.floor(Math.random()*5)]} just withdrew RS ${Math.floor(Math.random()*5000)+500}`;
        setTimeout(() => toast.style.bottom = "-100px", 4000);
    }, 15000);
                                  }
        
