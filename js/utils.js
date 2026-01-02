/**
 * Utility Functions Module
 * Common helper functions used across the application
 */

const Utils = {
    // Timezone constant
    TIMEZONE: 'Asia/Ho_Chi_Minh',

    // Mood data configuration
    MOOD_DATA: {
        1: { icon: '😢', label: 'Very Bad', color: 'mood-1' },
        2: { icon: '😔', label: 'Bad', color: 'mood-2' },
        3: { icon: '😐', label: 'Okay', color: 'mood-3' },
        4: { icon: '😊', label: 'Good', color: 'mood-4' },
        5: { icon: '😄', label: 'Great', color: 'mood-5' }
    },

    /**
     * Format date to locale string
     * @param {Date} date - Date object
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date string
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: this.TIMEZONE
        };
        return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },

    /**
     * Get date key in YYYY-MM-DD format
     * @param {Date} date - Date object
     * @returns {string} Date key
     */
    getDateKey(date) {
        return date.toLocaleDateString('en-CA', { timeZone: this.TIMEZONE });
    },

    /**
     * Get current date in Vietnam timezone
     * @returns {Date} Current date in timezone
     */
    getTodayInTimezone() {
        const now = new Date();
        const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: this.TIMEZONE }));
        return vietnamTime;
    },

    /**
     * Get mood data by type
     * @param {number} moodType - Mood type (1-5)
     * @returns {Object} Mood data
     */
    getMoodData(moodType) {
        return this.MOOD_DATA[moodType] || null;
    },

    /**
     * Format time to locale string
     * @param {Date} date - Date object
     * @returns {string} Formatted time string
     */
    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: this.TIMEZONE
        });
    },

    /**
     * Parse date from YYYY-MM-DD string
     * @param {string} dateKey - Date key in YYYY-MM-DD format
     * @returns {Date} Date object
     */
    parseDateKey(dateKey) {
        const [year, month, day] = dateKey.split('-').map(Number);
        return new Date(year, month - 1, day);
    },

    /**
     * Check if two dates are the same day
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {boolean}
     */
    isSameDay(date1, date2) {
        return this.getDateKey(date1) === this.getDateKey(date2);
    },

    /**
     * Get start and end of month
     * @param {Date} date - Any date in the month
     * @returns {Object} { start, end }
     */
    getMonthRange(date) {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return { start, end };
    },

    /**
     * Get days in month
     * @param {Date} date - Any date in the month
     * @returns {number} Number of days
     */
    getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    },

    /**
     * Get first day of week for a month (0 = Sunday)
     * @param {Date} date - Any date in the month
     * @returns {number} Day of week (0-6)
     */
    getFirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    }
};

// Export for use in other modules
window.Utils = Utils;
