// ... (Firebase config aur auth check purana hi rahega) ...

// 1. FAKE PAYOUTS (Patti)
function startFakePayouts() {
    const names = ["Zeeshan", "Malik_786", "Sana_Khan", "Ali_Pro", "Expert_Trader", "Raja_G"];
    const amounts = [500, 1200, 2500, 800, 5000, 300];
    
    setInterval(() => {
        const name = names[Math.floor(Math.random() * names.length)];
        const amt = amounts[Math.floor(Math.random() * amounts.length)];
        const toast = document.getElementById('payout-toast');
        if(toast) {
            document.getElementById('toast-text').innerText = `🎊 ${name} won PKR ${amt}`;
            toast.style.bottom = "20px";
            setTimeout(() => { toast.style.bottom = "-100px"; }, 4000);
        }
    }, 8000);
}

// 2. REAL LEADERBOARD (Fetch from Users)
function loadLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    onValue(ref(db, 'users'), (snap) => {
        const data = snap.val();
        if(!data) return;
        let html = "<ul>";
        Object.values(data).slice(0, 5).forEach(user => {
            html += `<li>${user.email.split('@')[0]} - <span style="color:gold">PKR ${user.balance || 0}</span></li>`;
        });
        html += "</ul>";
        if(list) list.innerHTML = html;
    });
}

// 3. REFERRAL LINK GENERATOR
onAuthStateChanged(auth, (user) => {
    if (user) {
        const refLink = `https://kingmaker2080397.github.io/Boom-earan/register.html?ref=${user.uid}`;
        const refElem = document.getElementById('referral-link');
        if(refElem) refElem.value = refLink;
        
        startFakePayouts();
        loadLeaderboard();
    }
});
