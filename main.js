import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, onValue, set, runTransaction } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyALm0SnUYjeeh4kJj9QBk4BgaINwnooa3c",
    authDomain: "boom-earnings.firebaseapp.com",
    databaseURL: "https://boom-earnings-default-rtdb.firebaseio.com",
    projectId: "boom-earnings",
    appId: "1:787871998344:web:3c20aa47e7e51001d01a3d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// 2. Sound Effects (Trade lagne par bajenge)
const betSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

// 3. User State & Balance Update
onAuthStateChanged(auth, (user) => {
    if (user) {
        onValue(ref(db, 'users/' + user.uid), (snap) => {
            const data = snap.val();
            const balElement = document.getElementById('top-balance');
            const uBalElement = document.getElementById('u-balance');
            const uNameElement = document.getElementById('u-name');

            if (data) {
                if (balElement) balElement.innerText = data.balance || 0;
                if (uBalElement) uBalElement.innerText = "PKR " + (data.balance || 0);
                if (uNameElement) uNameElement.innerText = data.name || "Player";
            }
        });
    }
});

// 4. Trade (Betting) Function
window.placeBet = (side) => {
    const user = auth.currentUser;
    if (!user) {
        alert("Pehle Login karein!");
        return;
    }

    // Amount input se lein ya fix rakhein (Yahan 10 rakha hai)
    const betAmount = 10; 
    const userRef = ref(db, 'users/' + user.uid);

    runTransaction(userRef, (currentData) => {
        if (currentData && (currentData.balance >= betAmount)) {
            currentData.balance -= betAmount;
            return currentData;
        }
        return; 
    }).then((result) => {
        if (result.committed) {
            // Sound play karein
            betSound.play().catch(e => console.log("Sound error"));
            
            // Firebase mein bet record save karein
            const newBetRef = ref(db, 'all_bets/' + Date.now());
            set(newBetRef, {
                uid: user.uid,
                side: side,
                amount: betAmount,
                timestamp: Date.now()
            });

            alert("Trade Successful on " + side.toUpperCase());
        } else {
            alert("Insufficient Balance! Please Deposit.");
        }
    }).catch((error) => {
        console.error(error);
        alert("Connection Error!");
    });
};

// 5. Timer System (15 Seconds)
let timeLeft = 15;
const timerDisplay = document.getElementById('timer');

if (timerDisplay) {
    setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) {
            timeLeft = 15; // Reset round
            // Yahan winner announce karne ka logic aayega
        }
        timerDisplay.innerText = `Next Round: 00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
    }, 1000);
        }
