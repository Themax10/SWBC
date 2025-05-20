let db = {
    events: [],
    bets: [],
    stats: {
        totalEvents: 0,
        activeEvents: 0,
        totalBets: 0,
        totalStake: 0
    }
};

const ADMIN_PASSWORD = "404";
const BANKER_PASSWORD = "666";

const EVENT_STATUS = {
    PENDING: "pending",
    CERTIFIED: "certified",
    OCCURRED: "occurred",
    REJECTED: "rejected"
};

const BET_STATUS = {
    PENDING: "pending",
    WON: "won",
    LOST: "lost",
    PAID: "paid"
};

const CATEGORY_EMOJIS = {
    class: "📚",
    teacher: "👨‍🏫",
    student: "👨‍🎓",
    facility: "🏫",
    event: "🎭",
    other: "🔮"
};

document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();
    setupEventListeners();
    initializeTabs();
    updateUI();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            if (tabId) {
                showTab(tabId);
            }
        });
    });
    showTab('home');
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.style.display = 'block';
        tabContent.classList.add('active');
    }
    
    const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    switch(tabId) {
        case 'home':
            updateHomeStats();
            loadTrendingEvents();
            loadRecentBets();
            break;
        case 'events':
            loadEventsList('all');
            break;
        case 'place-bet':
            updateEventSelect();
            toggleNewEventFields();
            break;
        case 'bets':
            loadBetsList('all');
            break;
        case 'leaderboard':
            loadLeaderboard();
            break;
        case 'admin':
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-content').style.display = 'none';
            break;
        case 'banker':
            document.getElementById('banker-login').style.display = 'block';
            document.getElementById('banker-content').style.display = 'none';
            break;
    }
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem("schulwetten_data");
    if (savedData) {
        db = JSON.parse(savedData);
    } else {
        createSampleData();
    }
    updateStats();
}

function saveToLocalStorage() {
    localStorage.setItem("schulwetten_data", JSON.stringify(db));
}

function setupEventListeners() {
    document.getElementById("bet-form")?.addEventListener("submit", handleBetSubmit);
    document.getElementById("event-select")?.addEventListener("change", toggleNewEventFields);
    document.getElementById("event-form")?.addEventListener("submit", handleEventSubmit);
    document.getElementById("admin-password")?.addEventListener("keyup", function(e) {
        if (e.key === "Enter") checkAdminPassword();
    });
    document.getElementById("banker-password")?.addEventListener("keyup", function(e) {
        if (e.key === "Enter") checkBankerPassword();
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            if (this.closest('#events')) {
                loadEventsList(filter);
            } else if (this.closest('#bets')) {
                loadBetsList(filter);
            }
        });
    });
}

function createSampleData() {
    db.events = [
        { id: 1, name: "Matheprüfung nächste Woche", category: "class", status: EVENT_STATUS.PENDING, bets: [] },
        { id: 2, name: "Lehrer krank", category: "teacher", status: EVENT_STATUS.CERTIFIED, bets: [] }
    ];
    db.bets = [
        { id: 1, bettor: "Max", eventId: 1, prediction: "Prüfung fällt aus", stake: "1 Schokolade", status: BET_STATUS.PENDING, timestamp: new Date().toISOString() },
        { id: 2, bettor: "Anna", eventId: 2, prediction: "Herr Müller fehlt", stake: "2 Kekse", status: BET_STATUS.WON, timestamp: new Date().toISOString() }
    ];
    updateStats();
    saveToLocalStorage();
}

function updateStats() {
    db.stats.totalEvents = db.events.length;
    db.stats.activeEvents = db.events.filter(e => e.status === EVENT_STATUS.CERTIFIED || e.status === EVENT_STATUS.PENDING).length;
    db.stats.totalBets = db.bets.length;
    db.stats.totalStake = db.bets.length; // Simplified: count stakes as number of bets
    updateHomeStats();
}

function updateHomeStats() {
    document.getElementById('total-events').textContent = db.stats.totalEvents;
    document.getElementById('active-events').textContent = db.stats.activeEvents;
    document.getElementById('total-bets').textContent = db.stats.totalBets;
    document.getElementById('total-stake').textContent = db.stats.totalStake;
}

function loadTrendingEvents() {
    const container = document.getElementById('trending-events');
    container.innerHTML = '';
    const trending = db.events.sort((a, b) => (b.bets?.length || 0) - (a.bets?.length || 0)).slice(0, 3);
    trending.forEach(event => {
        container.innerHTML += `
            <div class="card">
                <h3>${CATEGORY_EMOJIS[event.category]} ${event.name}</h3>
                <p>Status: ${event.status}</p>
                <p>Wetten: ${event.bets?.length || 0}</p>
            </div>
        `;
    });
}

function loadRecentBets() {
    const container = document.getElementById('recent-bets');
    container.innerHTML = '';
    const recent = db.bets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3);
    recent.forEach(bet => {
        const event = db.events.find(e => e.id === bet.eventId);
        container.innerHTML += `
            <div class="card">
                <h3>${bet.bettor}</h3>
                <p>Ereignis: ${event?.name || 'Unbekannt'}</p>
                <p>Wette: ${bet.prediction}</p>
                <p>Einsatz: ${bet.stake}</p>
            </div>
        `;
    });
}

function updateEventSelect() {
    const select = document.getElementById('event-select');
    select.innerHTML = '<option value="">Neues Ereignis erstellen</option>';
    db.events.filter(e => e.status !== EVENT_STATUS.REJECTED).forEach(event => {
        select.innerHTML += `<option value="${event.id}">${CATEGORY_EMOJIS[event.category]} ${event.name}</option>`;
    });
}

function toggleNewEventFields() {
    const select = document.getElementById('event-select');
    const newEventGroup = document.getElementById('new-event-group');
    newEventGroup.style.display = select.value === '' ? 'block' : 'none';
}

function handleBetSubmit(e) {
    e.preventDefault();
    const bettor = document.getElementById('bettor-name').value;
    const eventId = document.getElementById('event-select').value;
    const prediction = document.getElementById('prediction-text').value;
    const stake = document.getElementById('stake').value;
    const deadline = document.getElementById('deadline').value;

    let newEventId = eventId;
    if (!eventId) {
        const eventName = document.getElementById('event-name-input').value;
        const category = document.getElementById('event-category').value;
        if (!eventName) {
            showNotification("Bitte gib einen Ereignisnamen ein!", "error");
            return;
        }
        newEventId = db.events.length + 1;
        db.events.push({
            id: newEventId,
            name: eventName,
            category,
            status: EVENT_STATUS.PENDING,
            bets: []
        });
    }

    const bet = {
        id: db.bets.length + 1,
        bettor,
        eventId: parseInt(newEventId),
        prediction,
        stake,
        status: BET_STATUS.PENDING,
        timestamp: new Date().toISOString(),
        deadline: deadline || null
    };
    db.bets.push(bet);
    db.events.find(e => e.id === bet.eventId).bets.push(bet.id);
    updateStats();
    saveToLocalStorage();
    showNotification("Wette erfolgreich platziert!", "success");
    e.target.reset();
    updateEventSelect();
    toggleNewEventFields();
}

function handleEventSubmit(e) {
    e.preventDefault();
    const eventName = document.getElementById('event-name').value;
    const category = document.getElementById('admin-event-category').value;
    db.events.push({
        id: db.events.length + 1,
        name: eventName,
        category,
        status: EVENT_STATUS.PENDING,
        bets: []
    });
    updateStats();
    saveToLocalStorage();
    showNotification("Ereignis erfolgreich erstellt!", "success");
    e.target.reset();
    updateAdminUI();
}

function loadEventsList(filter) {
    const container = document.getElementById('event-list');
    container.innerHTML = '';
    let events = db.events;
    if (filter !== 'all') {
        events = events.filter(e => e.status === filter);
    }
    events.forEach(event => {
        container.innerHTML += `
            <div class="card">
                <h3>${CATEGORY_EMOJIS[event.category]} ${event.name}</h3>
                <p>Status: ${event.status}</p>
                <p>Wetten: ${event.bets?.length || 0}</p>
            </div>
        `;
    });
}

function loadBetsList(filter) {
    const container = document.getElementById('bet-list');
    container.innerHTML = '';
    let bets = db.bets;
    if (filter !== 'all') {
        bets = bets.filter(b => b.status === filter);
    }
    bets.forEach(bet => {
        const event = db.events.find(e => e.id === bet.eventId);
        container.innerHTML += `
            <div class="card">
                <h3>${bet.bettor}</h3>
                <p>Ereignis: ${event?.name || 'Unbekannt'}</p>
                <p>Wette: ${bet.prediction}</p>
                <p>Einsatz: ${bet.stake}</p>
                <p>Status: ${bet.status}</p>
            </div>
        `;
    });
}

function loadLeaderboard() {
    const topBettors = document.getElementById('top-bettors');
    const successfulBets = document.getElementById('successful-bets');
    topBettors.innerHTML = '';
    successfulBets.innerHTML = '';

    const bettorStats = {};
    db.bets.forEach(bet => {
        if (!bettorStats[bet.bettor]) {
            bettorStats[bet.bettor] = { total: 0, won: 0 };
        }
        bettorStats[bet.bettor].total++;
        if (bet.status === BET_STATUS.WON) {
            bettorStats[bet.bettor].won++;
        }
    });

    const sortedBettors = Object.entries(bettorStats)
        .sort((a, b) => b[1].won - a[1].won)
        .slice(0, 5);
    sortedBettors.forEach(([bettor, stats]) => {
        topBettors.innerHTML += `
            <div class="card">
                <h3>${bettor}</h3>
                <p>Gewonnene Wetten: ${stats.won}</p>
                <p>Gesamtwetten: ${stats.total}</p>
            </div>
        `;
    });

    const wonBets = db.bets.filter(b => b.status === BET_STATUS.WON).slice(0, 5);
    wonBets.forEach(bet => {
        const event = db.events.find(e => e.id === bet.eventId);
        successfulBets.innerHTML += `
            <div class="card">
                <h3>${bet.bettor}</h3>
                <p>Ereignis: ${event?.name || 'Unbekannt'}</p>
                <p>Wette: ${bet.prediction}</p>
                <p>Einsatz: ${bet.stake}</p>
            </div>
        `;
    });
}

function updateAdminUI() {
    const eventsTable = document.getElementById('admin-events-table').querySelector('tbody');
    const betsTable = document.getElementById('admin-bets-table').querySelector('tbody');
    eventsTable.innerHTML = '';
    betsTable.innerHTML = '';

    db.events.forEach(event => {
        eventsTable.innerHTML += `
            <tr>
                <td>${CATEGORY_EMOJIS[event.category]} ${event.name}</td>
                <td>${event.category}</td>
                <td>${event.status}</td>
                <td>${event.bets?.length || 0}</td>
                <td>
                    <button onclick="updateEventStatus(${event.id}, '${EVENT_STATUS.CERTIFIED}')">Zertifizieren</button>
                    <button onclick="updateEventStatus(${event.id}, '${EVENT_STATUS.OCCURRED}')">Eingetreten</button>
                    <button onclick="updateEventStatus(${event.id}, '${EVENT_STATUS.REJECTED}')">Ablehnen</button>
                </td>
            </tr>
        `;
    });

    db.bets.forEach(bet => {
        const event = db.events.find(e => e.id === bet.eventId);
        betsTable.innerHTML += `
            <tr>
                <td>${bet.bettor}</td>
                <td>${event?.name || 'Unbekannt'}</td>
                <td>${bet.stake}</td>
                <td>${bet.status}</td>
                <td>
                    <button onclick="updateBetStatus(${bet.id}, '${BET_STATUS.WON}')">Gewonnen</button>
                    <button onclick="updateBetStatus(${bet.id}, '${BET_STATUS.LOST}')">Verloren</button>
                </td>
            </tr>
        `;
    });
}

function updateBankerUI() {
    const betsTable = document.getElementById('banker-bets-table').querySelector('tbody');
    betsTable.innerHTML = '';

    db.bets.filter(b => b.status === BET_STATUS.WON).forEach(bet => {
        const event = db.events.find(e => e.id === bet.eventId);
        betsTable.innerHTML += `
            <tr>
                <td>${bet.bettor}</td>
                <td>${event?.name || 'Unbekannt'}</td>
                <td>${bet.stake}</td>
                <td>${bet.status}</td>
                <td>
                    <button onclick="updateBetStatus(${bet.id}, '${BET_STATUS.PAID}')">Ausbezahlt</button>
                </td>
            </tr>
        `;
    });
}

function updateEventStatus(eventId, status) {
    const event = db.events.find(e => e.id === eventId);
    if (event) {
        event.status = status;
        if (status === EVENT_STATUS.OCCURRED) {
            db.bets.filter(b => b.eventId === eventId).forEach(bet => {
                bet.status = BET_STATUS.WON; // Simplified logic
            });
        } else if (status === EVENT_STATUS.REJECTED) {
            db.bets.filter(b => b.eventId === eventId).forEach(bet => {
                bet.status = BET_STATUS.LOST;
            });
        }
        updateStats();
        saveToLocalStorage();
        updateAdminUI();
        showNotification(`Ereignisstatus auf ${status} aktualisiert!`, "success");
    }
}

function updateBetStatus(betId, status) {
    const bet = db.bets.find(b => b.id === betId);
    if (bet) {
        bet.status = status;
        updateStats();
        saveToLocalStorage();
        updateAdminUI();
        updateBankerUI();
        showNotification(`Wettstatus auf ${status} aktualisiert!`, "success");
    }
}

function checkAdminPassword() {
    const password = document.getElementById("admin-password").value;
    if (password === ADMIN_PASSWORD) {
        document.getElementById("admin-login").style.display = "none";
        document.getElementById("admin-content").style.display = "block";
        updateAdminUI();
    } else {
        showNotification("Falsches Passwort!", "error");
    }
}

function checkBankerPassword() {
    const password = document.getElementById("banker-password").value;
    if (password === BANKER_PASSWORD) {
        document.getElementById("banker-login").style.display = "none";
        document.getElementById("banker-content").style.display = "block";
        updateBankerUI();
    } else {
        showNotification("Falsches Passwort!", "error");
    }
}

function updateUI() {
    updateHomeStats();
    loadTrendingEvents();
    loadRecentBets();
    updateEventSelect();
    loadEventsList('all');
    loadBetsList('all');
    loadLeaderboard();
}
