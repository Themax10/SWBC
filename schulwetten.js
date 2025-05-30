console.log("schulwetten.js loaded");
const supabaseUrl = 'https://qirxdlnjyiveqhrstgki.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcnhkbG5qeWl2ZXFocnN0Z2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MTk1MzgsImV4cCI6MjA2NDA5NTUzOH0.o5Gx_MoYG_eGcVYq0He_ak8KzGWEr-HTnakICGb42Nc';

let supabase;
console.log("Attempting to initialize Supabase...");
if (typeof Supabase === 'undefined') {
    console.error("Supabase is not defined. Ensure Supabase script is loaded.");
    showNotification("Supabase-Bibliothek nicht geladen!", "error");
} else {
    console.log("Supabase object found, creating client...");
    try {
        supabase = Supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase client initialized");
    } catch (error) {
        console.error("Failed to initialize Supabase:", error);
        showNotification("Supabase-Initialisierung fehlgeschlagen!", "error");
    }
}

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
    console.log("DOM loaded, initializing app...");
    try {
        loadFromSupabase();
        setupEventListeners();
        initializeTabs();
        updateHomeStats();
    } catch (error) {
        console.error("Initialization error:", error);
        showNotification("Fehler beim Initialisieren der App!", "error");
    }
});

function initializeTabs() {
    console.log("Initializing tabs...");
    const tabs = document.querySelectorAll('.tab');
    if (!tabs.length) {
        console.error("No tabs found in DOM!");
        showNotification("Fehler: Keine Tabs gefunden!", "error");
        return;
    }
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            console.log(`Tab clicked: ${this.dataset.tab}`);
            const tabId = this.dataset.tab;
            if (tabId) {
                showTab(tabId);
            }
        });
    });
    showTab('home');
}

function showTab(tabId) {
    console.log(`Showing tab: ${tabId}`);
    try {
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
        } else {
            console.error(`Tab content not found for ID: ${tabId}`);
            showNotification(`Tab ${tabId} nicht gefunden!`, "error");
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
    } catch (error) {
        console.error("Error in showTab:", error);
        showNotification("Fehler beim Anzeigen des Tabs!", "error");
    }
}

async function loadFromSupabase() {
    console.log("Loading data from Supabase...");
    if (!supabase) {
        console.error("Supabase client not initialized");
        showNotification("Supabase nicht verfügbar!", "error");
        return;
    }
    try {
        const response = await fetch('/.netlify/functions/get-data');
        const data = await response.json();
        if (data.error) {
            console.error('Error loading data:', data.error);
            showNotification('Fehler beim Laden der Daten!', 'error');
            return;
        }
        console.log("Data loaded:", data);
        db.events = data.events || [];
        db.bets = data.bets || [];
        updateStats();
        updateHomeStats();
    } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('Fehler beim Laden der Daten!', 'error');
    }
}

function updateStats() {
    try {
        db.stats.totalEvents = db.events.length;
        db.stats.activeEvents = db.events.filter(e => e.status === EVENT_STATUS.CERTIFIED || e.status === EVENT_STATUS.PENDING).length;
        db.stats.totalBets = db.bets.length;
        db.stats.totalStake = db.bets.length; // Simplified
        updateHomeStats();
    } catch (error) {
        console.error("Error updating stats:", error);
        showNotification("Fehler beim Aktualisieren der Statistiken!", "error");
    }
}

function updateHomeStats() {
    try {
        document.getElementById('total-events').textContent = db.stats.totalEvents;
        document.getElementById('active-events').textContent = db.stats.activeEvents;
        document.getElementById('total-bets').textContent = db.stats.totalBets;
        document.getElementById('total-stake').textContent = db.stats.totalStake;
    } catch (error) {
        console.error("Error updating home stats:", error);
        showNotification("Fehler beim Aktualisieren der Home-Statistiken!", "error");
    }
}

function loadTrendingEvents() {
    const container = document.getElementById('trending-events');
    container.innerHTML = '';
    const trending = db.events.sort((a, b) => (b.bets?.length || 0) - (a.bets?.length || 0)).slice(0, 3);
    if (trending.length === 0) {
        container.innerHTML = '<p>Keine Ereignisse verfügbar.</p>';
    } else {
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
}

function loadRecentBets() {
    const container = document.getElementById('recent-bets');
    container.innerHTML = '';
    const recent = db.bets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3);
    if (recent.length === 0) {
        container.innerHTML = '<p>Keine Wetten verfügbar.</p>';
    } else {
        recent.forEach(bet => {
            const event = db.events.find(e => e.id === bet.event_id);
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
}

function updateEventSelect() {
    const select = document.getElementById('event-select');
    if (select) {
        select.innerHTML = '<option value="">Neues Ereignis erstellen</option>';
        db.events.filter(e => e.status !== EVENT_STATUS.REJECTED).forEach(event => {
            select.innerHTML += `<option value="${event.id}">${CATEGORY_EMOJIS[event.category]} ${event.name}</option>`;
        });
    }
}

function toggleNewEventFields() {
    const select = document.getElementById('event-select');
    const newEventGroup = document.getElementById('new-event-group');
    if (select && newEventGroup) {
        newEventGroup.style.display = select.value === '' ? 'block' : 'none';
    }
}

async function handleBetSubmit(e) {
    e.preventDefault();
    if (!supabase) {
        showNotification("Supabase nicht verfügbar!", "error");
        return;
    }
    const bettor = document.getElementById('bettor-name')?.value?.trim();
    const eventId = document.getElementById('event-select')?.value;
    const prediction = document.getElementById('prediction-text')?.value?.trim();
    const stake = document.getElementById('stake')?.value?.trim();
    const deadline = document.getElementById('deadline')?.value;

    if (!bettor || !prediction || !stake) {
        showNotification("Bitte fülle alle Pflichtfelder aus!", "error");
        return;
    }

    let newEventId = eventId;
    if (!eventId) {
        const eventName = document.getElementById('event-name-input')?.value?.trim();
        const category = document.getElementById('event-category')?.value;
        if (!eventName || !category) {
            showNotification("Bitte gib einen Ereignisnamen und eine Kategorie ein!", "error");
            return;
        }
        try {
            const response = await fetch('/.netlify/functions/create-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: eventName, category })
            });
            const data = await response.json();
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }
            newEventId = data.id;
            db.events.push(data);
            showNotification("Neues Ereignis erstellt!", "success");
        } catch (error) {
            showNotification("Fehler beim Erstellen des Ereignisses!", "error");
            return;
        }
    }

    try {
        const response = await fetch('/.netlify/functions/create-bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bettor, event_id: parseInt(newEventId), prediction, stake, deadline })
        });
        const data = await response.json();
        if (data.error) {
            showNotification(data.error, 'error');
            return;
        }
        db.bets.push(data);
        db.events.find(e => e.id === parseInt(newEventId)).bets = db.events.find(e => e.id === parseInt(newEventId)).bets || [];
        db.events.find(e => e.id === parseInt(newEventId)).bets.push(data.id);
        updateStats();
        showNotification("Wette erfolgreich platziert!", "success");
        e.target.reset();
        updateEventSelect();
        toggleNewEventFields();
        loadEventsList('all');
        loadBetsList('all');
    } catch (error) {
        showNotification("Fehler beim Platzieren der Wette!", "error");
    }
}

async function handleEventSubmit(e) {
    e.preventDefault();
    if (!supabase) {
        showNotification("Fehler: Supabase nicht verfügbar!", "error");
        return;
    }
    const eventName = document.getElementById('event-name')?.value?.trim();
    const category = document.getElementById('admin-event-category')?.value;
    
    if (!eventName || !category) {
        showNotification("Bitte gib einen Ereignisnamen und eine Kategorie ein!", "error");
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/create-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: eventName, category })
        });
        const data = await response.json();
        if (data.error) {
            showNotification(data.error, 'error');
            return;
        }
        db.events.push(data);
        updateStats();
        showNotification("Ereignis erfolgreich erstellt!", "success");
        e.target.reset();
        updateAdminUI();
        updateEventSelect();
        loadEventsList('all');
    } catch (error) {
        showNotification("Fehler beim Erstellen des Ereignisses!", "error");
    }
}

function loadEventsList(filter) {
    const container = document.getElementById('event-list');
    if (container) {
        container.innerHTML = '';
        let events = db.events;
        if (filter !== 'all') {
            events = events.filter(e => e.status === filter);
        }
        if (events.length === 0) {
            container.innerHTML = '<p>Keine Ereignisse verfügbar.</p>';
        } else {
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
    }
}

function loadBetsList(filter) {
    const container = document.getElementById('bet-list');
    if (container) {
        container.innerHTML = '';
        let bets = db.bets;
        if (filter !== 'all') {
            bets = bets.filter(b => b.status === filter);
        }
        if (bets.length === 0) {
            container.innerHTML = '<p>Keine Wetten verfügbar.</p>';
        } else {
            bets.forEach(bet => {
                const event = db.events.find(e => e.id === bet.event_id);
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
    }
}

function loadLeaderboard() {
    const topBettors = document.getElementById('top-bettors');
    const successfulBets = document.getElementById('successful-bets');
    if (topBettors && successfulBets) {
        topBettors.innerHTML = '';
        successfulBets.innerHTML = '';

        const bettorStats = {};
        db.bets.forEach(bet => {
            if (!bettorStats[bet.bettor]) {
                bettorStats[bet.bettor] = { total: 0, won: 0 };
            }
            bettorStats[bet.bettor].total++;
            if (bet.status === BET_STATUS.WON || bet.status === BET_STATUS.PAID) {
                bettorStats[bet.bettor].won++;
            }
        });

        const sortedBettors = Object.entries(bettorStats)
            .sort((a, b) => b[1].won - a[1].won)
            .slice(0, 5);
        if (sortedBettors.length === 0) {
            topBettors.innerHTML = '<p>Keine Wetter verfügbar.</p>';
        } else {
            sortedBettors.forEach(([bettor, stats]) => {
                topBettors.innerHTML += `
                    <div class="card">
                        <h3>${bettor}</h3>
                        <p>Gewonnene Wetten: ${stats.won}</p>
                        <p>Gesamtwetten: ${stats.total}</p>
                    </div>
                `;
            });
        }

        const wonBets = db.bets.filter(b => b.status === BET_STATUS.WON || b.status === BET_STATUS.PAID).slice(0, 5);
        if (wonBets.length === 0) {
            successfulBets.innerHTML = '<p>Keine erfolgreichen Wetten verfügbar.</p>';
        } else {
            wonBets.forEach(bet => {
                const event = db.events.find(e => e.id === bet.event_id);
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
    }
}

function updateAdminUI() {
    const eventsTable = document.getElementById('admin-events-table')?.querySelector('tbody');
    const betsTable = document.getElementById('admin-bets-table')?.querySelector('tbody');
    if (eventsTable && betsTable) {
        eventsTable.innerHTML = '';
        betsTable.innerHTML = '';

        if (db.events.length === 0) {
            eventsTable.innerHTML = '<tr><td colspan="5">Keine Ereignisse verfügbar.</td></tr>';
        } else {
            db.events.forEach(event => {
                eventsTable.innerHTML += `
                    <tr>
                        <td>${CATEGORY_EMOJIS[event.category]} ${event.name}</td>
                        <td>${event.category}</td>
                        <td>${event.status}</td>
                        <td>${event.bets?.length || 0}</td>
                        <td>
                            <button class="btn-primary" onclick="updateEventStatus(${event.id}, '${EVENT_STATUS.CERTIFIED}')">Zertifizieren</button>
                            <button class="btn-primary" onclick="updateEventStatus(${event.id}, '${EVENT_STATUS.OCCURRED}')">Eingetreten</button>
                            <button class="btn-primary" onclick="updateEventStatus(${event.id}, '${EVENT_STATUS.REJECTED}')">Ablehnen</button>
                        </td>
                    </tr>
                `;
            });
        }

        if (db.bets.length === 0) {
            betsTable.innerHTML = '<tr><td colspan="5">Keine Wetten verfügbar.</td></tr>';
        } else {
            db.bets.forEach(bet => {
                const event = db.events.find(e => e.id === bet.event_id);
                betsTable.innerHTML += `
                    <tr>
                        <td>${bet.bettor}</td>
                        <td>${event?.name || 'Unbekannt'}</td>
                        <td>${bet.stake}</td>
                        <td>${bet.status}</td>
                        <td>
                            <button class="btn-primary" onclick="updateBetStatus(${bet.id}, '${BET_STATUS.WON}')">Gewonnen</button>
                            <button class="btn-primary" onclick="updateBetStatus(${bet.id}, '${BET_STATUS.LOST}')">Verloren</button>
                            <button class="btn-primary" onclick="updateBetStatus(${bet.id}, '${BET_STATUS.PAID}')">Ausbezahlt</button>
                        </td>
                    </tr>
                `;
            });
        }
    }
}

function updateBankerUI() {
    const betsTable = document.getElementById('banker-bets-table')?.querySelector('tbody');
    if (betsTable) {
        betsTable.innerHTML = '';
        const paidBets = db.bets.filter(bet => bet.status === BET_STATUS.PAID);
        if (paidBets.length === 0) {
            betsTable.innerHTML = '<tr><td colspan="4">Keine ausbezahlten Wetten.</td></tr>';
        } else {
            paidBets.forEach(bet => {
                const event = db.events.find(e => e.id === bet.event_id);
                betsTable.innerHTML += `
                    <tr>
                        <td>${bet.bettor}</td>
                        <td>${event?.name || 'Unbekannt'}</td>
                        <td>${bet.stake}</td>
                        <td>${bet.paid_date ? new Date(bet.paid_date).toLocaleString('de-DE') : 'Unbekannt'}</td>
                    </tr>
                `;
            });
        }
    }
}

async function updateEventStatus(eventId, status) {
    if (!supabase) {
        showNotification("Supabase nicht verfügbar!", "error");
        return;
    }
    try {
        const response = await fetch('/.netlify/functions/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: eventId, status })
        });
        const data = await response.json();
        if (data.error) {
            showNotification(data.error, 'error');
            return;
        }
        const event = db.events.find(e => e.id === eventId);
        if (event) {
            event.status = status;
        }
        if (status === EVENT_STATUS.OCCURRED) {
            db.bets.filter(b => b.event_id === eventId).forEach(bet => {
                bet.status = BET_STATUS.WON;
            });
        } else if (status === EVENT_STATUS.REJECTED) {
            db.bets.filter(b => b.event_id === eventId).forEach(bet => {
                bet.status = BET_STATUS.LOST;
            });
        }
        updateStats();
        updateAdminUI();
        updateEventSelect();
        loadEventsList('all');
        loadBetsList('all');
        loadLeaderboard();
        showNotification(`Ereignisstatus auf ${status} aktualisiert!`, "success");
    } catch (error) {
        showNotification("Fehler beim Aktualisieren des Ereignisstatus!", "error");
    }
}

async function updateBetStatus(betId, status) {
    if (!supabase) {
        showNotification("Supabase nicht verfügbar!", "error");
        return;
    }
    try {
        const response = await fetch('/.netlify/functions/update-bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: betId, status })
        });
        const data = await response.json();
        if (data.error) {
            showNotification(data.error, 'error');
            return;
        }
        const bet = db.bets.find(b => b.id === betId);
        if (bet) {
            bet.status = status;
            if (status === BET_STATUS.PAID) {
                bet.paid_date = new Date().toISOString();
            }
        }
        updateStats();
        updateAdminUI();
        updateBankerUI();
        loadBetsList('all');
        showNotification(`Wettstatus auf ${status} aktualisiert!`, "success");
    } catch (error) {
        showNotification("Fehler beim Aktualisieren des Wettstatus!", "error");
    }
}

function checkAdminPassword() {
    const password = document.getElementById("admin-password")?.value;
    if (password === ADMIN_PASSWORD) {
        document.getElementById("admin-login").style.display = "none";
        document.getElementById("admin-content").style.display = "block";
        updateAdminUI();
    } else {
        showNotification("Falsches Passwort!", "error");
    }
}

function checkBankerPassword() {
    const password = document.getElementById("banker-password")?.value;
    if (password === BANKER_PASSWORD) {
        document.getElementById("banker-login").style.display = "none";
        document.getElementById("banker-content").style.display = "block";
        updateBankerUI();
    } else {
        showNotification("Falsches Passwort!", "error");
    }
}

function setupEventListeners() {
    const betForm = document.getElementById('bet-form');
    const eventForm = document.getElementById('event-form');
    const eventSelect = document.getElementById('event-select');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (betForm) {
        betForm.addEventListener('submit', handleBetSubmit);
    }
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmit);
    }
    if (eventSelect) {
        eventSelect.addEventListener('change', toggleNewEventFields);
    }
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
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
