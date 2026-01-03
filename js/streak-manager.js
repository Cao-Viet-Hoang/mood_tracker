/**
 * Streak Manager Module
 * Handles streak calculation and database caching
 */

const StreakManager = {
    /**
     * Calculate current streak from entries
     * @param {Array} entries - Array of entry objects
     * @returns {number} Current streak days
     */
    calculateCurrentStreak(entries) {
        if (!entries || entries.length === 0) return 0;

        const todayDate = Utils.getTodayInTimezone();
        const todayDateKey = Utils.getDateKey(todayDate);
        
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayDateKey = Utils.getDateKey(yesterdayDate);

        // Create a Set of entry dates for fast lookup
        const entryDates = new Set(entries.map(e => e.dateKey));

        // Determine starting date for streak calculation
        let currentDate;
        
        if (entryDates.has(todayDateKey)) {
            // If today has an entry, start from today
            currentDate = new Date(todayDate);
        } else if (entryDates.has(yesterdayDateKey)) {
            // If today doesn't have entry but yesterday does, start from yesterday
            currentDate = new Date(yesterdayDate);
        } else {
            // If neither today nor yesterday has entry, streak is 0
            return 0;
        }

        // Count consecutive days backwards from startDate
        let streak = 0;
        while (entryDates.has(Utils.getDateKey(currentDate))) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    },

    /**
     * Calculate longest streak from entries
     * @param {Array} entries - Array of entry objects
     * @returns {number} Longest streak days
     */
    calculateLongestStreak(entries) {
        if (!entries || entries.length === 0) return 0;

        const sortedDates = [...entries]
            .map(e => e.dateKey)
            .sort();

        let longest = 1;
        let current = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);

            // Check if consecutive days
            prevDate.setDate(prevDate.getDate() + 1);
            if (Utils.getDateKey(prevDate) === sortedDates[i]) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 1;
            }
        }

        return longest;
    },

    /**
     * Get streak data from cache (database)
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} Streak data or null if not found
     */
    async getStreakFromCache(userId) {
        try {
            if (!userId) return null;

            const db = FirebaseConfig.getDb();
            const accountDoc = await db.collection('accounts').doc(userId).get();

            if (!accountDoc.exists) return null;

            const data = accountDoc.data();
            if (!data.streaks) return null;

            // Validate cache structure
            const { currentStreak, longestStreak, lastCalculated } = data.streaks;
            if (currentStreak === undefined || longestStreak === undefined || !lastCalculated) {
                return null;
            }

            return {
                currentStreak,
                longestStreak,
                lastCalculated: lastCalculated.toDate()
            };
        } catch (error) {
            console.error('[StreakManager] Error getting streak from cache:', error);
            return null;
        }
    },

    /**
     * Calculate and save streak to database
     * @param {string} userId - User ID
     * @param {Array} entries - Array of entry objects (optional, will fetch if not provided)
     * @returns {Promise<Object>} { currentStreak, longestStreak, lastCalculated }
     */
    async calculateAndSaveStreak(userId, entries = null) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const db = FirebaseConfig.getDb();

            // Fetch entries if not provided
            if (!entries) {
                const querySnapshot = await db.collection('accounts')
                    .doc(userId)
                    .collection('entries')
                    .get();

                entries = [];
                querySnapshot.forEach(doc => {
                    entries.push(doc.data());
                });
            }

            // Calculate streaks
            const currentStreak = this.calculateCurrentStreak(entries);
            const longestStreak = this.calculateLongestStreak(entries);
            const lastCalculated = new Date();

            const streakData = {
                currentStreak,
                longestStreak,
                lastCalculated: firebase.firestore.Timestamp.fromDate(lastCalculated)
            };

            // Save to database
            await db.collection('accounts')
                .doc(userId)
                .update({
                    streaks: streakData
                });

            console.log('[StreakManager] Streak saved to cache:', { currentStreak, longestStreak });

            return {
                currentStreak,
                longestStreak,
                lastCalculated
            };
        } catch (error) {
            console.error('[StreakManager] Error calculating and saving streak:', error);
            throw error;
        }
    },

    /**
     * Get streak with caching - try cache first, calculate if needed
     * @param {string} userId - User ID
     * @param {Array} entries - Array of entry objects (optional)
     * @returns {Promise<Object>} { currentStreak, longestStreak, fromCache: boolean }
     */
    async getStreak(userId, entries = null) {
        try {
            // Try to get from cache first
            const cached = await this.getStreakFromCache(userId);
            
            if (cached) {
                // Cache is valid, use it
                console.log('[StreakManager] Using cached streak');
                return {
                    currentStreak: cached.currentStreak,
                    longestStreak: cached.longestStreak,
                    fromCache: true
                };
            }

            // Cache not found or invalid, calculate and save
            console.log('[StreakManager] Cache miss, calculating streak');
            const calculated = await this.calculateAndSaveStreak(userId, entries);
            
            return {
                currentStreak: calculated.currentStreak,
                longestStreak: calculated.longestStreak,
                fromCache: false
            };
        } catch (error) {
            console.error('[StreakManager] Error getting streak:', error);
            
            // Fallback to calculation without caching
            if (entries) {
                return {
                    currentStreak: this.calculateCurrentStreak(entries),
                    longestStreak: this.calculateLongestStreak(entries),
                    fromCache: false
                };
            }
            
            return {
                currentStreak: 0,
                longestStreak: 0,
                fromCache: false
            };
        }
    },

    /**
     * Update streak cache when an entry is added/updated/deleted
     * Call this after any entry modification
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated streak data
     */
    async updateStreakOnEntryChange(userId) {
        try {
            return await this.calculateAndSaveStreak(userId);
        } catch (error) {
            console.error('[StreakManager] Error updating streak on entry change:', error);
            throw error;
        }
    }
};

// Export for use in other modules
window.StreakManager = StreakManager;
