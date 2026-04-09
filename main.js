import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, onValue, set, runTransaction } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

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

// --- Global Function for Buttons ---
window.placeBet = (side) => {
    const user = auth.currentUser;
    if (!user) { alert("Please Login First!"); return; }

    const userRef = ref(db, 'users/' + user.uid);
    runTransaction(userRef, (currentData) => {
        if (currentData && currentData.balance >= 10) {
            currentData.balance -= 10;
            return currentData;
        }
        return;
    }).then((result) => {
        if (result.committed) {
            alert("Success! Bet placed on " + side);
            new Audio('https://www.soundjay.com/buttons/button-16.mp3').play();
        } else {
            alert("Insufficient Balance!");
        }
    });
};

// --- Real-time Updates ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        onValue(ref(db, 'users/' + user.uid), (snap) => {
            const data = snap.val();
            if (data) {
                if(document.getElementById('top-balance')) document.getElementById('top-balance').innerText = data.balance || 0;
                if(document.getElementById('u-balance')) document.getElementById('u-balance').innerText = "PKR " + (data.balance || 0);
                if(document.getElementById('u-name')) document.getElementById('u-name').innerText = data.name || "User";
            }
        });
    }
});

// --- Timer ---
let timeLeft = 15;
setInterval(() => {
    const timerText = document.getElementById('timer');
    if (timerText) {
        timeLeft = timeLeft <= 0 ? 15 : timeLeft - 1;
        timerText.innerText = `Next Round: 00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
    }
}, 1000);
            
