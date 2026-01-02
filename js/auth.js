/**
 * Authentication Module
 * Custom authentication using Firestore with username/password
 * Accounts are created by admin only
 */

const Auth = {
    currentUser: null,

    /**
     * Login with username and password
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} User object on success
     */
    async login(username, password) {
        try {
            if (!FirebaseConfig.isReady()) {
                throw new Error('Firebase not initialized');
            }

            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            const db = FirebaseConfig.getDb();

            // Get user account data
            const accountDoc = await db.collection('accounts').doc(username).get();

            if (!accountDoc.exists) {
                throw new Error('Invalid username or password');
            }

            const accountData = accountDoc.data();

            // Verify password
            if (accountData.password !== password) {
                throw new Error('Invalid username or password');
            }

            this.currentUser = {
                username: username
            };

            // Save session
            Storage.saveUserSession({ username });

            console.log('Login successful:', this.currentUser);
            return this.currentUser;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Logout current user
     */
    logout() {
        this.currentUser = null;
        Storage.clearUserSession();
        console.log('User logged out');
    },

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return !!this.currentUser;
    },

    /**
     * Get current user
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    },

    /**
     * Get current username
     * @returns {string|null}
     */
    getUsername() {
        return this.currentUser?.username || null;
    },

    /**
     * Get current user ID (same as username for this implementation)
     * @returns {string|null}
     */
    getUserId() {
        return this.currentUser?.username || null;
    },

    /**
     * Try to restore session from localStorage
     * @returns {Promise<boolean>} True if session restored successfully
     */
    async tryRestoreSession() {
        try {
            const config = Storage.getFirebaseConfig();
            const session = Storage.getUserSession();

            if (!config || !session) {
                return false;
            }

            // Initialize Firebase with saved config
            FirebaseConfig.initialize(config);

            const db = FirebaseConfig.getDb();

            // Verify user still exists
            const accountDoc = await db.collection('accounts').doc(session.username).get();

            if (!accountDoc.exists) {
                Storage.clearUserSession();
                return false;
            }

            this.currentUser = {
                username: session.username
            };

            console.log('Session restored for:', session.username);
            return true;
        } catch (error) {
            console.error('Error restoring session:', error);
            Storage.clearUserSession();
            return false;
        }
    },

    /**
     * Validate Firebase config by trying to connect
     * @param {Object} config - Firebase config
     * @returns {Promise<boolean>}
     */
    async validateConfig(config) {
        try {
            // Try to initialize Firebase
            FirebaseConfig.initialize(config);

            // Try to access Firestore to verify connection
            const db = FirebaseConfig.getDb();
            await db.collection('_test').limit(1).get();

            return true;
        } catch (error) {
            console.error('Config validation error:', error);
            return false;
        }
    }
};

// Export for use in other modules
window.Auth = Auth;
