/**
 * Storage Module - Handle localStorage operations
 * Manages Firebase config and user session persistence
 */

const Storage = {
    KEYS: {
        FIREBASE_CONFIG: 'mood_tracker_firebase_config',
        USER_SESSION: 'mood_tracker_user_session'
    },

    /**
     * Save Firebase configuration to localStorage
     * @param {Object} config - Firebase config object
     */
    saveFirebaseConfig(config) {
        try {
            localStorage.setItem(this.KEYS.FIREBASE_CONFIG, JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('Error saving Firebase config:', error);
            return false;
        }
    },

    /**
     * Get Firebase configuration from localStorage
     * @returns {Object|null} Firebase config or null if not found
     */
    getFirebaseConfig() {
        try {
            const config = localStorage.getItem(this.KEYS.FIREBASE_CONFIG);
            return config ? JSON.parse(config) : null;
        } catch (error) {
            console.error('Error reading Firebase config:', error);
            return null;
        }
    },

    /**
     * Check if Firebase config exists
     * @returns {boolean}
     */
    hasFirebaseConfig() {
        return !!this.getFirebaseConfig();
    },

    /**
     * Clear Firebase configuration
     */
    clearFirebaseConfig() {
        localStorage.removeItem(this.KEYS.FIREBASE_CONFIG);
    },

    /**
     * Save user session
     * @param {Object} session - User session data (username, loginTime)
     */
    saveUserSession(session) {
        try {
            localStorage.setItem(this.KEYS.USER_SESSION, JSON.stringify({
                ...session,
                loginTime: new Date().toISOString()
            }));
            return true;
        } catch (error) {
            console.error('Error saving user session:', error);
            return false;
        }
    },

    /**
     * Get user session from localStorage
     * @returns {Object|null} User session or null if not found
     */
    getUserSession() {
        try {
            const session = localStorage.getItem(this.KEYS.USER_SESSION);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error reading user session:', error);
            return null;
        }
    },

    /**
     * Check if user has active session
     * @returns {boolean}
     */
    hasUserSession() {
        return !!this.getUserSession();
    },

    /**
     * Clear user session
     */
    clearUserSession() {
        localStorage.removeItem(this.KEYS.USER_SESSION);
    },

    /**
     * Clear all app data
     */
    clearAll() {
        this.clearFirebaseConfig();
        this.clearUserSession();
    }
};

// Export for use in other modules
window.Storage = Storage;
