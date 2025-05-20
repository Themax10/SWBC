// schulwetten.js - Hauptlogik für SchulWetten 🏫

// Lokaler Speicher für Daten
let db = {
    events: [],     // Alle Ereignisse
    bets: [],       // Alle Wetten
    stats: {        // Statistiken
        totalEvents: 0,
        activeEvents: 0,
        totalBets: 0,
        totalStake: 0
    }
};

// Passwörter (geändert wie gewünscht)
const ADMIN_PASSWORD = "404";      // Neues Admin-Passwort
const BANKER_PASSWORD = "666";     // Neues Banker-Passwort

// Status Konstanten
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

// Emoji-Mapping
const CATEGORY_EMOJIS = {
    class: "📚",
    teacher: "👨‍🏫",
    student: "👨‍🎓",
    facility: "🏫",
    event: "🎭",
    other: "🔮"
};

// Initialisierung
document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();
    setupEventListeners();
    initializeTabs(); // Neu: Verbesserte Tab-Initialisierung
    updateUI();
});

// Verbesserte Tab-Initialisierung
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Tab-ID aus dem data-tab Attribut lesen
            const tabId = this.dataset.tab || 
                         this.getAttribute('onclick')?.match(/showTab\('(.+)'\)/)?.[1];
            
            if (tabId) {
                showTab(tabId);
            }
        });
    });
    
    // Starte mit Home-Tab
    showTab('home');
}

// Tab anzeigen (vollständig überarbeitet)
function showTab(tabId) {
    // Verstecke alle Tab-Inhalte
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // Entferne aktive Klasse von allen Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Zeige gewählten Tab-Inhalt
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.style.display = 'block';
        tabContent.classList.add('active');
    }
    
    // Markiere aktiven Tab
    const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`) || 
                     document.querySelector(`.tab[onclick*="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Tab-spezifische Initialisierung
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
            // Passwort-Eingabe anzeigen
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-content').style.display = 'none';
            break;
        case 'banker':
            // Passwort-Eingabe anzeigen
            document.getElementById('banker-login').style.display = 'block';
            document.getElementById('banker-content').style.display = 'none';
            break;
    }
}

// Daten laden/speichern
function loadFromLocalStorage() {
    const savedData = localStorage.getItem("schulwetten_data");
    if (savedData) db = JSON.parse(savedData);
    else createSampleData();
    updateStats();
}

function saveToLocalStorage() {
    localStorage.setItem("schulwetten_data", JSON.stringify(db));
}

// Event-Listener
function setupEventListeners() {
    // Wett-Formular
    document.getElementById("bet-form")?.addEventListener("submit", handleBetSubmit);
    
    // Ereignis-Auswahl
    document.getElementById("event-select")?.addEventListener("change", toggleNewEventFields);
    
    // Admin-Formular
    document.getElementById("event-form")?.addEventListener("submit", handleEventSubmit);
    
    // Admin-Login
    document.getElementById("admin-password")?.addEventListener("keyup", function(e) {
        if (e.key === "Enter") checkAdminPassword();
    });
    
    // Banker-Login
    document.getElementById("banker-password")?.addEventListener("keyup", function(e) {
        if (e.key === "Enter") checkBankerPassword();
    });
}

// [Rest der Funktionen wie zuvor...]
// (createSampleData, updateStats, loadTrendingEvents, etc.)

// Admin-Passwort prüfen
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

// Banker-Passwort prüfen
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

// HTML muss entsprechend angepasst werden:
// Tab-Buttons sollten data-tab Attribute haben:
// <button class="tab" data-tab="home">...</button>
// <button class="tab" data-tab="events">...</button>
// etc.
