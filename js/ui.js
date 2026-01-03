/**
 * UI Module
 * Handles UI state management, toast notifications, loading states
 */

const UI = {
    // Cache DOM elements
    elements: null,

    /**
     * Initialize UI module and cache DOM elements
     */
    init() {
        this.elements = {
            // Login
            loginModal: document.getElementById('loginModal'),
            loginForm: document.getElementById('loginForm'),
            loginError: document.getElementById('loginError'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            firebaseConfigInput: document.getElementById('firebaseConfig'),

            // App
            app: document.getElementById('app'),
            logoutBtn: document.getElementById('logoutBtn'),

            // Views
            todayView: document.getElementById('todayView'),
            calendarView: document.getElementById('calendarView'),
            dashboardView: document.getElementById('dashboardView'),
            statsView: document.getElementById('statsView'),

            // Today View
            currentDate: document.getElementById('currentDate'),
            moodNote: document.getElementById('moodNote'),
            saveMoodBtn: document.getElementById('saveMoodBtn'),
            currentEntry: document.getElementById('currentEntry'),

            // Calendar
            calendarMonth: document.getElementById('calendarMonth'),
            calendarGrid: document.getElementById('calendarGrid'),
            prevMonth: document.getElementById('prevMonth'),
            nextMonth: document.getElementById('nextMonth'),

            // Dashboard
            dateRange: document.getElementById('dateRange'),
            customRange: document.getElementById('customRange'),
            applyRange: document.getElementById('applyRange'),

            // Edit Modal
            editModal: document.getElementById('editModal'),
            editDate: document.getElementById('editDate'),
            editNote: document.getElementById('editNote'),
            closeEditModal: document.getElementById('closeEditModal'),
            cancelEdit: document.getElementById('cancelEdit'),
            saveEdit: document.getElementById('saveEdit'),

            // Navigation
            navItems: document.querySelectorAll('.nav-item'),

            // States
            toast: document.getElementById('toast'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };
    },

    /**
     * Get cached DOM elements
     * @returns {Object} DOM elements
     */
    getElements() {
        if (!this.elements) {
            this.init();
        }
        return this.elements;
    },

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type ('success' | 'error')
     */
    showToast(message, type = 'success') {
        const toast = this.elements.toast;
        const toastMessage = toast.querySelector('.toast-message');
        const toastIcon = toast.querySelector('.toast-icon');

        toastMessage.textContent = message;
        toastIcon.textContent = type === 'success' ? '✓' : '⚠️';

        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');

        // Trigger reflow for animation
        void toast.offsetWidth;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    },

    /**
     * Show/hide loading overlay
     * @param {boolean} isLoading - Loading state
     * @param {string} message - Loading message
     */
    setLoading(isLoading, message = 'Loading...') {
        const loadingText = this.elements.loadingOverlay.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }

        if (isLoading) {
            this.elements.loadingOverlay.classList.remove('hidden');
        } else {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    },

    /**
     * Show login error message
     * @param {string} message - Error message
     */
    showLoginError(message) {
        const errorText = this.elements.loginError.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        }
        this.elements.loginError.classList.remove('hidden');
    },

    /**
     * Hide login error message
     */
    hideLoginError() {
        this.elements.loginError.classList.add('hidden');
    },

    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} isLoading - Loading state
     */
    setButtonLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');

        if (isLoading) {
            btnText?.classList.add('hidden');
            btnLoader?.classList.remove('hidden');
            button.disabled = true;
        } else {
            btnText?.classList.remove('hidden');
            btnLoader?.classList.add('hidden');
            button.disabled = false;
        }
    },

    /**
     * Show the main app container
     */
    showApp() {
        this.elements.loginModal.classList.remove('active');
        setTimeout(() => {
            this.elements.loginModal.classList.add('hidden');
        }, 300);

        this.elements.app.classList.remove('hidden');
    },

    /**
     * Show login modal
     */
    showLoginModal() {
        this.elements.app.classList.add('hidden');
        this.elements.loginModal.classList.remove('hidden');

        // Trigger reflow
        void this.elements.loginModal.offsetWidth;
        this.elements.loginModal.classList.add('active');

        // Reset form
        this.elements.passwordInput.value = '';
        this.elements.firebaseConfigInput.value = '';
        this.hideLoginError();

        // Update placeholder if config is saved
        const savedConfig = Storage.getFirebaseConfig();
        if (savedConfig) {
            this.elements.firebaseConfigInput.placeholder = 'Config saved. Leave empty to use saved config, or paste new config to update.';
        }
    },

    /**
     * Open modal
     * @param {HTMLElement} modal - Modal element
     */
    openModal(modal) {
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.add('active');
    },

    /**
     * Close modal
     * @param {HTMLElement} modal - Modal element
     */
    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
};

// Export for use in other modules
window.UI = UI;
