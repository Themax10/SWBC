console.log("ui-helpers.js loaded");
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    if (!notification || !messageElement) {
        console.error("Notification elements not found!");
        return;
    }
    messageElement.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
