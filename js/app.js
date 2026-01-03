/**
 * Mood Tracker - Main Application Entry Point
 * Initializes all modules and handles login/logout flow
 */

const App = {
    isLoggedIn: false,

    /**
     * Initialize the application
     */
    async init() {
        // Initialize UI module first (caches DOM elements)
        UI.init();

        // Initialize login handlers
        this.initLoginHandlers();

        // Initialize logout handler
        this.initLogoutHandler();

        // Try auto login with saved session
        const autoLoggedIn = await this.tryAutoLogin();

        if (!autoLoggedIn) {
            // Show login modal
            UI.getElements().loginModal.classList.add('active');
        }
    },

    /**
     * Initialize login form handlers
     */
    initLoginHandlers() {
        const elements = UI.getElements();

        elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Check if Firebase config exists in localStorage
        const savedConfig = Storage.getFirebaseConfig();
        if (savedConfig) {
            elements.firebaseConfigInput.placeholder = 'Config saved. Leave empty to use saved config, or paste new config to update.';
        }

        // Clear error on input
        elements.usernameInput.addEventListener('input', () => UI.hideLoginError());
        elements.passwordInput.addEventListener('input', () => UI.hideLoginError());
        elements.firebaseConfigInput.addEventListener('input', () => UI.hideLoginError());
    },

    /**
     * Initialize logout handler
     */
    initLogoutHandler() {
        const elements = UI.getElements();
        elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Display name form
        elements.displayNameForm.addEventListener('submit', (e) => this.handleDisplayNameSubmit(e));
    },

    /**
     * Handle login form submission
     * @param {Event} e - Submit event
     */
    async handleLogin(e) {
        e.preventDefault();
        UI.hideLoginError();

        const elements = UI.getElements();
        const username = elements.usernameInput.value.trim();
        const password = elements.passwordInput.value;
        const firebaseConfigText = elements.firebaseConfigInput.value.trim();

        // Validation
        if (!username) {
            UI.showLoginError('Please enter your username');
            elements.usernameInput.focus();
            return;
        }

        if (!password) {
            UI.showLoginError('Please enter your password');
            elements.passwordInput.focus();
            return;
        }

        // Get Firebase config
        let firebaseConfig = Storage.getFirebaseConfig();

        // If user provided new config, parse and use it
        if (firebaseConfigText) {
            try {
                firebaseConfig = FirebaseConfig.parseConfig(firebaseConfigText);
            } catch (error) {
                UI.showLoginError(error.message);
                elements.firebaseConfigInput.focus();
                return;
            }
        }

        // Check if we have a config
        if (!firebaseConfig) {
            UI.showLoginError('Please paste your Firebase config JSON');
            elements.firebaseConfigInput.focus();
            return;
        }

        // Show loading state
        const submitBtn = elements.loginForm.querySelector('button[type="submit"]');
        UI.setButtonLoading(submitBtn, true);

        try {
            // Initialize Firebase
            FirebaseConfig.initialize(firebaseConfig);

            // Save config to localStorage for future use
            Storage.saveFirebaseConfig(firebaseConfig);

            // Attempt login
            await Auth.login(username, password);

            // Login successful - show app
            this.onLoginSuccess(Auth.getUsername());

        } catch (error) {
            console.error('Auth error:', error);
            this.handleLoginError(error);
        } finally {
            UI.setButtonLoading(submitBtn, false);
        }
    },

    /**
     * Handle login error
     * @param {Error} error - Error object
     */
    handleLoginError(error) {
        let errorMessage = 'Authentication failed. Please try again.';

        const message = error.message.toLowerCase();

        if (message.includes('invalid username or password')) {
            errorMessage = 'Invalid username or password';
        } else if (message.includes('network')) {
            errorMessage = 'Network error. Please check your connection.';
        } else if (message.includes('permission-denied') || message.includes('permission denied')) {
            errorMessage = 'Access denied. Please contact administrator.';
        } else if (message.includes('firebase')) {
            errorMessage = 'Firebase connection error. Please check your config.';
        }

        UI.showLoginError(errorMessage);
    },

    /**
     * Called on successful login
     * @param {string} username - Logged in username
     */
    async onLoginSuccess(username) {
        const elements = UI.getElements();

        // Show app
        UI.showApp();
        this.isLoggedIn = true;

        // Clear password field for security
        elements.passwordInput.value = '';

        // Initialize all view modules
        Navigation.init();
        TodayView.init();
        CalendarView.init();
        DashboardView.init();
        StatsView.init();

        // Refresh today view to load existing entry
        TodayView.refresh();

        // Check if user has display name
        if (!Auth.hasDisplayName()) {
            // Show display name modal
            UI.showDisplayNameModal();
        } else {
            // Show welcome message
            const displayName = Auth.getDisplayName();
            UI.showToast(`Welcome back, ${displayName}!`);
        }
    },

    /**
     * Handle logout
     */
    handleLogout() {
        const confirmed = confirm('Are you sure you want to logout?');
        if (!confirmed) return;

        // Clear session
        Auth.logout();
        this.isLoggedIn = false;

        // Show login modal
        UI.showLoginModal();

        UI.showToast('Logged out successfully');
    },

    /**
     * Handle display name form submission
     * @param {Event} e - Submit event
     */
    async handleDisplayNameSubmit(e) {
        e.preventDefault();

        const elements = UI.getElements();
        const displayName = elements.displayNameInput.value.trim();

        if (!displayName) {
            UI.showDisplayNameError('Please enter a display name');
            return;
        }

        if (displayName.length > 50) {
            UI.showDisplayNameError('Display name is too long (max 50 characters)');
            return;
        }

        // Set loading state
        const submitBtn = elements.displayNameForm.querySelector('button[type="submit"]');
        UI.setButtonLoading(submitBtn, true);
        UI.hideDisplayNameError();

        try {
            // Update display name
            await Auth.updateDisplayName(displayName);

            // Hide modal
            UI.hideDisplayNameModal();

            // Show welcome message
            UI.showToast(`Welcome, ${displayName}! 🌸`);
        } catch (error) {
            console.error('Display name update error:', error);
            UI.showDisplayNameError(error.message || 'Failed to update display name');
        } finally {
            UI.setButtonLoading(submitBtn, false);
        }
    },

    /**
     * Try auto login with saved session
     * @returns {Promise<boolean>} True if auto login successful
     */
    async tryAutoLogin() {
        if (!Storage.hasFirebaseConfig()) {
            return false;
        }

        UI.setLoading(true, 'Restoring session...');

        try {
            const restored = await Auth.tryRestoreSession();

            if (restored) {
                const username = Auth.getUsername();
                this.onLoginSuccess(username);
                return true;
            }
        } catch (error) {
            console.error('Auto login failed:', error);
        } finally {
            UI.setLoading(false);
        }

        return false;
    }
};

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Export for use in other modules
window.App = App;
