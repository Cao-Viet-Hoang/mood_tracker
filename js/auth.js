/**
 * Authentication Module
 * Custom authentication using Firebase Realtime Database
 * Users are stored in accounts/{username} with password field
 */

const Auth = {
    currentUser: null,

    /**
     * Login with username and password
     * Validates credentials against Firebase Realtime Database
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

            // Get user data from accounts/{username}
            const snapshot = await db.ref(`accounts/${username}`).once('value');

            if (!snapshot.exists()) {
                throw new Error('Invalid username or password');
            }

            const userData = snapshot.val();

            // Compare password (plain text comparison as per requirements)
            // Note: In production, you should use hashed passwords
            if (userData.password !== password) {
                throw new Error('Invalid username or password');
            }

            // Set current user
            this.currentUser = {
                username: username,
                ...userData,
                password: undefined // Don't store password in memory
            };

            // Save session to localStorage
            Storage.saveUserSession({
                username: username
            });

            console.log('Login successful:', username);
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
     * Try to restore session from localStorage
     * @returns {Promise<boolean>} True if session restored successfully
     */
    async tryRestoreSession() {
        try {
            const session = Storage.getUserSession();
            const config = Storage.getFirebaseConfig();

            if (!session || !config) {
                return false;
            }

            // Initialize Firebase with saved config
            FirebaseConfig.initialize(config);

            // Verify user still exists in database
            const db = FirebaseConfig.getDb();
            const snapshot = await db.ref(`accounts/${session.username}`).once('value');

            if (!snapshot.exists()) {
                // User no longer exists, clear session
                Storage.clearUserSession();
                return false;
            }

            // Restore user data
            const userData = snapshot.val();
            this.currentUser = {
                username: session.username,
                ...userData,
                password: undefined
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

            // Try to access database to verify connection
            const db = FirebaseConfig.getDb();
            await db.ref('.info/connected').once('value');

            return true;
        } catch (error) {
            console.error('Config validation error:', error);
            return false;
        }
    }
};

// Export for use in other modules
window.Auth = Auth;
