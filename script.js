// schulwetten.js - Hauptlogik für SchulWetten 🏫
// Dieses Skript verwaltet die Daten und Funktionen für die SchulWetten-Plattform

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

// Admin- und Banker-Passwörter (für Demo-Zwecke)
const ADMIN_PASSWORD = "admin123";  // Admin-Passwort
const BANKER_PASSWORD = "banker123"; // Banker-Passwort

// Event-Status Konstanten
const EVENT_STATUS = {
    PENDING: "pending",
    CERTIFIED: "certified",
    OCCURRED: "occurred",
    REJECTED: "rejected"
};

// Wetten-Status Konstanten
const BET_STATUS = {
    PENDING: "pending",
    WON: "won",
    LOST: "lost",
    PAID: "paid"
};

// Emoji-Mapping für Kategorien
const CATEGORY_EMOJIS = {
    class: "📚",
    teacher: "👨‍🏫",
    student: "👨‍🎓",
    facility: "🏫",
    event: "🎭",
    other: "🔮"
};

// Initialisierung beim Laden der Seite
document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();
    initializeTabSystem();
    setupEventListeners();
    updateUI();
});

// Daten aus dem LocalStorage laden
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem("schulwetten_data");
        if (savedData) {
            db = JSON.parse(savedData);
        } else {
            // Bei erstem Start: Beispieldaten erstellen
            createSampleData();
        }
        
        // Berechne die Statistiken neu
        updateStats();
    } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
        showNotification("Fehler beim Laden der Daten", "error");
    }
}

// Daten im LocalStorage speichern
function saveToLocalStorage() {
    try {
        localStorage.setItem("schulwetten_data", JSON.stringify(db));
    } catch (error) {
        console.error("Fehler beim Speichern der Daten:", error);
        showNotification("Fehler beim Speichern der Daten", "error");
    }
}

// Event-Listener einrichten
function setupEventListeners() {
    // Wett-Formular
    document.getElementById("bet-form").addEventListener("submit", handleBetSubmit);
    
    // Ereignis-Auswahl im Wett-Formular
    document.getElementById("event-select").addEventListener("change", toggleNewEventFields);
    
    // Ereignis-Formular (Admin)
    document.getElementById("event-form")?.addEventListener("submit", handleEventSubmit);
    
    // Seitenspezifische Initialisierungen
    initializePages();
}

// Tab-System initialisieren - korrigierte Version
function initializeTabSystem() {
    // Tab-Buttons Event-Listener hinzufügen
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('onclick').match(/showTab\('(.+)'\)/)[1];
            showTab(tabId);
        });
    });
    
    // Standard-Tab anzeigen (Home)
    showTab('home');
}

// Tab anzeigen - korrigierte Version
function showTab(tabId) {
    // Alle Tab-Inhalte ausblenden
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Alle Tabs deaktivieren
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Gewählten Tab-Inhalt anzeigen
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Aktiven Tab-Button markieren
    const activeTab = document.querySelector(`.tab[onclick="showTab('${tabId}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Tab-spezifische Inhalte aktualisieren
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
            // Admin-Bereich bleibt versteckt bis Passwort eingegeben wird
            break;
        case 'banker':
            // Banker-Bereich bleibt versteckt bis Passwort eingegeben wird
            break;
    }
}

// [Rest des JavaScript-Codes bleibt unverändert wie in der vorherigen Antwort...]
// (Alle anderen Funktionen wie createSampleData, updateStats, loadTrendingEvents, etc. bleiben gleich)

// Beispieldaten erstellen
function createSampleData() {
    // Beispiel-Ereignisse
    const sampleEvents = [
        { 
            id: "event1", 
            name: "Herr Schmidt kommt zu spät zum Unterricht", 
            category: "teacher", 
            status: EVENT_STATUS.CERTIFIED,
            createdAt: new Date().toISOString(),
            betCount: 0
        },
        { 
            id: "event2", 
            name: "Die Klassenarbeit in Mathe wird verschoben", 
            category: "class", 
            status: EVENT_STATUS.CERTIFIED,
            createdAt: new Date().toISOString(),
            betCount: 0
        }
    ];
    
    // Beispiel-Wetten
    const sampleBets = [
        {
            id: "bet1",
            eventId: "event1",
            bettorName: "Max Mustermann",
            prediction: "Herr Schmidt kommt am Montag mindestens 5 Minuten zu spät.",
            stake: "1 Schokoriegel",
            status: BET_STATUS.PENDING,
            createdAt: new Date().toISOString(),
            deadline: addDays(new Date(), 7).toISOString()
        }
    ];
    
    db.events = sampleEvents;
    db.bets = sampleBets;
    
    // Ereignis-Zähler aktualisieren
    sampleEvents.forEach(event => {
        const betsForEvent = sampleBets.filter(bet => bet.eventId === event.id);
        event.betCount = betsForEvent.length;
    });
}

// [Alle weiteren Funktionen wie in der vorherigen Antwort...]

// Passwort-Informationen:
// - Admin-Passwort: "admin123" (für den Admin-Bereich)
// - Banker-Passwort: "banker123" (für den Banker-Bereich)
