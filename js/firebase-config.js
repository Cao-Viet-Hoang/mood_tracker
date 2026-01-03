/**
 * Firebase Configuration Module
 * Handles Firebase initialization and provides Firestore reference
 */

const FirebaseConfig = {
    app: null,
    db: null,
    isInitialized: false,

    /**
     * Initialize Firebase with config
     * @param {Object} config - Firebase configuration object
     * @returns {boolean} Success status
     */
    initialize(config) {
        try {
            // Validate config has required fields (databaseURL is optional for Firestore)
            const requiredFields = ['apiKey', 'authDomain', 'projectId'];
            for (const field of requiredFields) {
                if (!config[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            // Check if Firebase is already initialized
            if (this.isInitialized) {
                return true;
            }

            // Initialize Firebase
            this.app = firebase.initializeApp(config);
            this.db = firebase.firestore();

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.isInitialized = false;
            throw error;
        }
    },

    /**
     * Get Firestore reference
     * @returns {Object} Firebase Firestore
     */
    getDb() {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }
        return this.db;
    },

    /**
     * Check if Firebase is initialized
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized;
    },

    /**
     * Parse and validate Firebase config string
     * Supports both JSON format and JavaScript object format (from Firebase Console)
     * @param {string} configString - Config string (JSON or JS object format)
     * @returns {Object} Parsed config object
     */
    parseConfig(configString) {
        let config;

        try {
            // First, try standard JSON parse
            config = JSON.parse(configString);
        } catch (jsonError) {
            // If JSON parse fails, try to convert JS object format to JSON
            try {
                // Convert JS object format to JSON:
                // - Add quotes around unquoted keys
                // - Handle trailing commas
                let fixedString = configString
                    // Remove any 'const firebaseConfig = ' or similar prefix
                    .replace(/^[\s\S]*?{/, '{')
                    // Remove trailing semicolon if present
                    .replace(/;[\s]*$/, '')
                    // Add quotes around unquoted keys (handles keys like apiKey, authDomain, etc.)
                    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
                    // Remove trailing commas before closing braces
                    .replace(/,(\s*[}\]])/g, '$1');

                config = JSON.parse(fixedString);
            } catch (fixError) {
                throw new Error('Invalid config format. Please paste the Firebase config object from Firebase Console.');
            }
        }

        // Validate required fields for Firestore (databaseURL is optional)
        const requiredFields = ['apiKey', 'authDomain', 'projectId'];
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new Error(`Invalid config: missing ${field}`);
            }
        }

        return config;
    },

    /**
     * Reset Firebase (for logout or config change)
     */
    reset() {
        if (this.app) {
            // Delete the Firebase app instance
            this.app.delete().then(() => {
                this.app = null;
                this.db = null;
                this.isInitialized = false;
            }).catch(error => {
                console.error('Error resetting Firebase:', error);
            });
        }
    }
};

// Export for use in other modules
window.FirebaseConfig = FirebaseConfig;
