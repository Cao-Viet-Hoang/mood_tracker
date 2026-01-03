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
                username: username,
                displayName: accountData.displayName || username
            };

            // Save session
            Storage.saveUserSession({ 
                username,
                displayName: accountData.displayName || username
            });

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
     * Get current user display name
     * @returns {string|null}
     */
    getDisplayName() {
        return this.currentUser?.displayName || this.currentUser?.username || null;
    },

    /**
     * Check if current user has display name set
     * @returns {boolean}
     */
    hasDisplayName() {
        const accountData = this.currentUser;
        return accountData && accountData.displayName && accountData.displayName !== accountData.username;
    },

    /**
     * Update display name for current user
     * @param {string} displayName - New display name
     * @returns {Promise<void>}
     */
    async updateDisplayName(displayName) {
        try {
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            if (!displayName || displayName.trim().length === 0) {
                throw new Error('Display name cannot be empty');
            }

            if (displayName.length > 50) {
                throw new Error('Display name is too long (max 50 characters)');
            }

            const db = FirebaseConfig.getDb();
            const username = this.currentUser.username;

            // Update in Firestore
            await db.collection('accounts').doc(username).update({
                displayName: displayName.trim()
            });

            // Update in memory
            this.currentUser.displayName = displayName.trim();

            // Update session
            Storage.saveUserSession({
                username: this.currentUser.username,
                displayName: displayName.trim()
            });

            console.log('Display name updated:', displayName.trim());
        } catch (error) {
            console.error('Error updating display name:', error);
            throw error;
        }
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

            const accountData = accountDoc.data();

            this.currentUser = {
                username: session.username,
                displayName: accountData.displayName || session.displayName || session.username
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
