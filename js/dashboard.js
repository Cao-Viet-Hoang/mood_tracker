/**
 * Dashboard View Module
 * Handles insights, charts, and statistics display
 */

const DashboardView = {
    currentRange: '30',
    entries: [],

    /**
     * Initialize Dashboard view
     */
    init() {
        const elements = UI.getElements();

        // Range selector
        elements.dateRange.addEventListener('change', () => this.handleRangeChange());

        // Custom range apply button
        elements.applyRange.addEventListener('click', () => this.handleApplyCustomRange());
    },

    /**
     * Refresh Dashboard view
     */
    refresh() {
        // TODO: Load data from Firebase and update charts
    },

    /**
     * Handle range selection change
     */
    handleRangeChange() {
        const elements = UI.getElements();
        const value = elements.dateRange.value;

        if (value === 'custom') {
            elements.customRange.classList.remove('hidden');
        } else {
            elements.customRange.classList.add('hidden');
            this.currentRange = value;
            this.loadDataForRange(value);
        }
    },

    /**
     * Handle custom range apply
     */
    handleApplyCustomRange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            UI.showToast('Please select both dates', 'error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            UI.showToast('Start date must be before end date', 'error');
            return;
        }

        this.loadDataForCustomRange(startDate, endDate);
        UI.showToast('Custom range applied');
    },

    /**
     * Load data for a preset range
     * @param {string} range - Range value ('7', '30', 'month')
     */
    async loadDataForRange(range) {
        // TODO: Implement Firebase data loading
        console.log('Loading data for range:', range);
    },

    /**
     * Load data for custom date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     */
    async loadDataForCustomRange(startDate, endDate) {
        // TODO: Implement Firebase data loading
        console.log('Loading data for custom range:', startDate, '-', endDate);
    },

    /**
     * Update all dashboard statistics
     * @param {Array} entries - Array of mood entries
     */
    updateStats(entries) {
        this.entries = entries;
        this.updateSummaryCards();
        this.updateMoodDistribution();
        this.updateMoodTrend();
        this.updateInsights();
        this.updateLoggingRate();
    },

    /**
     * Update summary cards (total entries, week, month, streak)
     */
    updateSummaryCards() {
        // TODO: Calculate and update summary cards
    },

    /**
     * Update mood distribution bar chart
     */
    updateMoodDistribution() {
        // TODO: Calculate mood counts and update bar chart
    },

    /**
     * Update mood trend line chart
     */
    updateMoodTrend() {
        // TODO: Generate trend line SVG
    },

    /**
     * Update insight cards (dominant mood, best/worst day, weekly trend)
     */
    updateInsights() {
        // TODO: Calculate insights
    },

    /**
     * Update logging rate circle
     */
    updateLoggingRate() {
        // TODO: Calculate logging percentage
    },

    /**
     * Calculate current streak
     * @param {Array} entries - Sorted entries array
     * @returns {number} Current streak days
     */
    calculateCurrentStreak(entries) {
        if (!entries || entries.length === 0) return 0;

        const today = Utils.getDateKey(Utils.getTodayInTimezone());
        let streak = 0;
        let currentDate = new Date(today);

        // Sort entries by date descending
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(b.dateKey) - new Date(a.dateKey)
        );

        const entryDates = new Set(sortedEntries.map(e => e.dateKey));

        // Count consecutive days from today backwards
        while (entryDates.has(Utils.getDateKey(currentDate))) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    },

    /**
     * Calculate longest streak
     * @param {Array} entries - Entries array
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
     * Calculate average mood score
     * @param {Array} entries - Entries array
     * @returns {number} Average mood (1-5)
     */
    calculateAverageMood(entries) {
        if (!entries || entries.length === 0) return 0;

        const sum = entries.reduce((acc, e) => acc + e.moodType, 0);
        return (sum / entries.length).toFixed(1);
    },

    /**
     * Calculate dominant mood
     * @param {Array} entries - Entries array
     * @returns {Object} { moodType, count, percentage }
     */
    calculateDominantMood(entries) {
        if (!entries || entries.length === 0) return null;

        const counts = {};
        entries.forEach(e => {
            counts[e.moodType] = (counts[e.moodType] || 0) + 1;
        });

        const dominant = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            moodType: parseInt(dominant[0]),
            count: dominant[1],
            percentage: Math.round((dominant[1] / entries.length) * 100)
        };
    },

    /**
     * Calculate best and worst days of week
     * @param {Array} entries - Entries array
     * @returns {Object} { best, worst }
     */
    calculateBestWorstDays(entries) {
        if (!entries || entries.length === 0) return { best: null, worst: null };

        const dayStats = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        entries.forEach(e => {
            const date = new Date(e.dateKey);
            const day = date.getDay();

            if (!dayStats[day]) {
                dayStats[day] = { sum: 0, count: 0 };
            }
            dayStats[day].sum += e.moodType;
            dayStats[day].count++;
        });

        let best = null;
        let worst = null;
        let bestAvg = 0;
        let worstAvg = 6;

        Object.entries(dayStats).forEach(([day, stats]) => {
            const avg = stats.sum / stats.count;
            if (avg > bestAvg) {
                bestAvg = avg;
                best = { day: dayNames[day], avg: avg.toFixed(1) };
            }
            if (avg < worstAvg) {
                worstAvg = avg;
                worst = { day: dayNames[day], avg: avg.toFixed(1) };
            }
        });

        return { best, worst };
    }
};

// Export for use in other modules
window.DashboardView = DashboardView;
