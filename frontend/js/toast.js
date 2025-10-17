/**
 * AI Prosthetic Optimizer - Toast Notifications
 * Elegant toast notification system
 */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', or 'info'
 * @param {number} duration - How long to show the toast in milliseconds
 */
function showToast(message, type = 'success', duration = 5000) {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="flex items-start">
            <span class="text-2xl mr-3">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <div class="flex-1">
                <p class="text-gray-800 font-semibold text-sm">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-gray-400 hover:text-gray-600">
                ✕
            </button>
        </div>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
