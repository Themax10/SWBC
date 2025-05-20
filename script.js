id === bet.eventId) || { name: "Unbekanntes Ereignis" };
        
        return `
            <tr>
                <td>${bet.bettorName}</td>
                <td>${event.name}</td>
                <td>${bet.stake}</td>
                <td><span class="status-badge status-won">Gewonnen</span></td>
                <td class="action-cell">
                    <button class="btn-small btn-success" onclick="markBetPaid('${bet.id}')">
                        <span class="emoji-icon">💰</span> Ausgezahlt
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// Wette als ausgezahlt markieren
function markBetPaid(betId) {
    const bet = db.bets.find(b => b.id === betId);
    if (bet) {
        bet.status = BET_STATUS.PAID;
        saveToLocalStorage();
        updateUI();
        showNotification("Wette als ausgezahlt markiert!", "success");
    }
}

// Tab-System initialisieren
function initializeTabSystem() {
    // Standard-Tab anzeigen (Home)
    showTab('home');
    
    // Tab-Buttons Event-Listener hinzufügen
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Alle Tabs deaktivieren
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            
            // Aktiven Tab markieren
            this.classList.add('active');
        });
    });
}

// Tab anzeigen
function showTab(tabId) {
    // Alle Tab-Inhalte ausblenden
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Gewählten Tab-Inhalt anzeigen
    document.getElementById(tabId).classList.add('active');
    
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

// Home-Statistiken aktualisieren
function updateHomeStats() {
    document.getElementById('total-events').textContent = db.stats.totalEvents;
    document.getElementById('active-events').textContent = db.stats.activeEvents;
    document.getElementById('total-bets').textContent = db.stats.totalBets;
    document.getElementById('total-stake').textContent = db.stats.totalStake;
}

// Ereignisauswahl im Wettformular aktualisieren
function updateEventSelect() {
    const eventSelect = document.getElementById('event-select');
    if (!eventSelect) return;
    
    // Nur zertifizierte Ereignisse anzeigen
    const certifiedEvents = db.events.filter(event => event.status === EVENT_STATUS.CERTIFIED);
    
    // Bestehende Optionen löschen (außer der ersten)
    while (eventSelect.options.length > 1) {
        eventSelect.remove(1);
    }
    
    // Ereignisse hinzufügen
    certifiedEvents.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = `${CATEGORY_EMOJIS[event.category]} ${event.name}`;
        eventSelect.appendChild(option);
    });
}

// Benachrichtigung anzeigen
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    if (!notification || !notificationMessage) return;
    
    // Nachricht und Typ setzen
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    
    // Benachrichtigung anzeigen
    notification.classList.add('show');
    
    // Nach 5 Sekunden ausblenden
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// UI aktualisieren
function updateUI() {
    // Home-Seite aktualisieren
    updateHomeStats();
    loadTrendingEvents();
    loadRecentBets();
    
    // Ereignisse-Seite aktualisieren
    if (document.getElementById('events').classList.contains('active')) {
        loadEventsList('all');
    }
    
    // Wetten-Seite aktualisieren
    if (document.getElementById('bets').classList.contains('active')) {
        loadBetsList('all');
    }
    
    // Rangliste aktualisieren
    if (document.getElementById('leaderboard').classList.contains('active')) {
        loadLeaderboard();
    }
    
    // Admin-Bereich aktualisieren
    if (document.getElementById('admin-content').style.display === 'block') {
        updateAdminUI();
    }
    
    // Banker-Bereich aktualisieren
    if (document.getElementById('banker-content')?.style.display === 'block') {
        updateBankerUI();
    }
    
    // Ereignisauswahl aktualisieren
    updateEventSelect();
}

// Ereigniskarte erstellen
function createEventCardHTML(event) {
    const statusBadge = `<span class="status-badge status-${event.status}">${getStatusText(event.status, "event")}</span>`;
    const categoryEmoji = CATEGORY_EMOJIS[event.category] || '🔮';
    
    return `
        <div class="event-card">
            <div class="card-header">
                <h3 class="card-title">${categoryEmoji} ${event.name}</h3>
                ${statusBadge}
            </div>
            <div class="card-content">
                <p><strong>Kategorie:</strong> ${getCategoryText(event.category)}</p>
                <p><strong>Wetten:</strong> ${event.betCount}</p>
                <p><strong>Erstellt:</strong> ${formatDate(event.createdAt)}</p>
            </div>
        </div>
    `;
}

// Wettekarte erstellen
function createBetCardHTML(bet) {
    const statusBadge = `<span class="status-badge status-${bet.status}">${getStatusText(bet.status, "bet")}</span>`;
    const event = db.events.find(e => e.id === bet.eventId) || { name: "Unbekanntes Ereignis", category: "other" };
    const categoryEmoji = CATEGORY_EMOJIS[event.category] || '🔮';
    
    return `
        <div class="bet-card">
            <div class="card-header">
                <h3 class="card-title">${categoryEmoji} ${event.name}</h3>
                ${statusBadge}
            </div>
            <div class="card-content">
                <p><strong>Wetter:</strong> ${bet.bettorName}</p>
                <p><strong>Vorhersage:</strong> ${bet.prediction}</p>
                <p><strong>Einsatz:</strong> ${bet.stake}</p>
                ${bet.deadline ? `<p><strong>Deadline:</strong> ${formatDate(bet.deadline)}</p>` : ''}
                <p><strong>Erstellt:</strong> ${formatDate(bet.createdAt)}</p>
            </div>
        </div>
    `;
}

// Status-Text für Anzeige
function getStatusText(status, type) {
    const statusTexts = {
        event: {
            pending: "Ausstehend",
            certified: "Zertifiziert",
            occurred: "Eingetreten",
            rejected: "Abgelehnt"
        },
        bet: {
            pending: "Ausstehend",
            won: "Gewonnen",
            lost: "Verloren",
            paid: "Ausbezahlt"
        }
    };
    
    return statusTexts[type][status] || status;
}

// Kategorie-Text für Anzeige
function getCategoryText(category) {
    const categoryTexts = {
        class: "Unterricht",
        teacher: "Lehrer",
        student: "Schüler",
        facility: "Schulgebäude",
        event: "Schulveranstaltung",
        other: "Sonstiges"
    };
    
    return categoryTexts[category] || category;
}

// Datum formatieren
function formatDate(dateString) {
    if (!dateString) return "Kein Datum";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Tage zu einem Datum hinzufügen
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// UI-Helper-Funktionen
function uiHelpers() {
    return {
        // Funktionen für UI-Interaktionen
    };
}
