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
    async refresh() {
        await this.loadDataForRange(this.currentRange);
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
        try {
            const userId = Auth.getUserId();
            if (!userId) {
                this.updateStats([]);
                return;
            }

            const db = FirebaseConfig.getDb();
            const today = Utils.getTodayInTimezone();
            let startDate;

            // Calculate start date based on range
            if (range === 'month') {
                // Current month
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            } else if (range === 'week') {
                // This week (Monday to Sunday)
                startDate = new Date(today);
                const dayOfWeek = startDate.getDay();
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is 1, Sunday is 0
                startDate.setDate(startDate.getDate() - diff);
            } else {
                // Last N days (including today)
                const days = parseInt(range);
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - (days - 1));
            }

            const startDateKey = Utils.getDateKey(startDate);
            const endDateKey = Utils.getDateKey(today);

            console.log(`Loading range: ${range} days, from ${startDateKey} to ${endDateKey}`);

            // Query entries for range
            const querySnapshot = await db.collection('accounts')
                .doc(userId)
                .collection('entries')
                .where('dateKey', '>=', startDateKey)
                .where('dateKey', '<=', endDateKey)
                .orderBy('dateKey', 'asc')
                .get();

            // Build entries array
            const entries = [];
            querySnapshot.forEach(doc => {
                entries.push(doc.data());
            });

            console.log(`Loaded ${entries.length} entries for range: ${range} (${startDateKey} to ${endDateKey})`);
            this.updateStats(entries);
        } catch (error) {
            console.error('Error loading data for range:', error);
            this.updateStats([]);
        }
    },

    /**
     * Load data for custom date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     */
    async loadDataForCustomRange(startDate, endDate) {
        try {
            const userId = Auth.getUserId();
            if (!userId) {
                this.updateStats([]);
                return;
            }

            const db = FirebaseConfig.getDb();

            // Query entries for custom range
            const querySnapshot = await db.collection('accounts')
                .doc(userId)
                .collection('entries')
                .where('dateKey', '>=', startDate)
                .where('dateKey', '<=', endDate)
                .orderBy('dateKey', 'asc')
                .get();

            // Build entries array
            const entries = [];
            querySnapshot.forEach(doc => {
                entries.push(doc.data());
            });

            console.log(`Loaded ${entries.length} entries for custom range: ${startDate} - ${endDate}`);
            this.updateStats(entries);
        } catch (error) {
            console.error('Error loading data for custom range:', error);
            this.updateStats([]);
        }
    },

    /**
     * Update all dashboard statistics
     * @param {Array} entries - Array of mood entries
     */
    updateStats(entries) {
        this.entries = entries;
        this.updateSummaryCards();
        this.updateInsights();
        this.updateLoggingRate();
    },

    /**
     * Update summary cards (total entries, week, month, streak)
     */
    updateSummaryCards() {
        const totalEntries = this.entries.length;
        const currentStreak = this.calculateCurrentStreak(this.entries);
        const longestStreak = this.calculateLongestStreak(this.entries);

        // Update summary cards
        const summaryCards = document.querySelectorAll('.summary-value');
        if (summaryCards.length >= 4) {
            // Total Entries
            summaryCards[0].textContent = totalEntries;
            
            // This Week - count entries in last 7 days
            const today = Utils.getTodayInTimezone();
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const weekKey = Utils.getDateKey(sevenDaysAgo);
            const weekEntries = this.entries.filter(e => e.dateKey > weekKey).length;
            summaryCards[1].textContent = weekEntries;
            
            // This Month - count entries in current month
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthKey = Utils.getDateKey(monthStart);
            const monthEntries = this.entries.filter(e => e.dateKey >= monthKey).length;
            summaryCards[2].textContent = monthEntries;
            
            // Current Streak
            summaryCards[3].textContent = currentStreak;
        }

        // Update streak info
        const streakCurrent = document.querySelector('.streak-current');
        const streakBest = document.querySelector('.streak-best');
        if (streakCurrent) streakCurrent.textContent = `${currentStreak} days`;
        if (streakBest) streakBest.textContent = `Best: ${longestStreak} days`;
        
        // Update streak bar
        const streakFill = document.querySelector('.streak-fill');
        if (streakFill && longestStreak > 0) {
            const percentage = (currentStreak / longestStreak) * 100;
            streakFill.style.width = `${percentage}%`;
        }
    },

    /**
     * Update insight cards (dominant mood, best/worst day, weekly trend)
     */
    updateInsights() {
        // Dominant Mood
        const dominantMood = this.calculateDominantMood(this.entries);
        const dominantCard = document.querySelector('.insights-grid .insight-card:nth-child(1)');
        if (dominantCard && dominantMood) {
            const moodData = Utils.getMoodData(dominantMood.moodType);
            dominantCard.querySelector('.insight-icon').textContent = moodData.icon;
            dominantCard.querySelector('.insight-text').textContent = moodData.label;
            dominantCard.querySelector('.insight-detail').textContent = 
                `Appeared ${dominantMood.count} times (${dominantMood.percentage}%)`;
        } else if (dominantCard) {
            dominantCard.querySelector('.insight-icon').textContent = '—';
            dominantCard.querySelector('.insight-text').textContent = 'No data';
            dominantCard.querySelector('.insight-detail').textContent = 'No entries yet';
        }

        // Best and Worst Days
        const { best, worst } = this.calculateBestWorstDays(this.entries);
        
        const bestCard = document.querySelector('.insights-grid .insight-card:nth-child(2)');
        if (bestCard && best) {
            bestCard.querySelector('.insight-text').textContent = best.day;
            bestCard.querySelector('.insight-detail').textContent = `Avg mood: ${best.avg}`;
        } else if (bestCard) {
            bestCard.querySelector('.insight-text').textContent = 'No data';
            bestCard.querySelector('.insight-detail').textContent = 'No entries yet';
        }

        const worstCard = document.querySelector('.insights-grid .insight-card:nth-child(3)');
        if (worstCard && worst) {
            worstCard.querySelector('.insight-text').textContent = worst.day;
            worstCard.querySelector('.insight-detail').textContent = `Avg mood: ${worst.avg}`;
        } else if (worstCard) {
            worstCard.querySelector('.insight-text').textContent = 'No data';
            worstCard.querySelector('.insight-detail').textContent = 'No entries yet';
        }

        // Weekly Trend
        this.updateWeeklyTrend();
    },

    /**
     * Update logging rate circle
     */
    updateLoggingRate() {
        const today = Utils.getTodayInTimezone();
        let totalDays;
        
        // Calculate total days based on range
        if (this.currentRange === 'month') {
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            totalDays = Math.min(daysInMonth, today.getDate());
        } else {
            totalDays = parseInt(this.currentRange);
        }

        // Count unique dates in entries
        const uniqueDates = new Set(this.entries.map(e => e.dateKey));
        const loggedDays = uniqueDates.size;
        const percentage = totalDays > 0 ? Math.round((loggedDays / totalDays) * 100) : 0;

        // Update circle chart
        const rateFill = document.querySelector('.rate-fill');
        const rateText = document.querySelector('.rate-text');
        const rateDetail = document.querySelector('.rate-detail');

        if (rateFill) {
            rateFill.setAttribute('stroke-dasharray', `${percentage}, 100`);
        }
        if (rateText) {
            rateText.textContent = `${percentage}%`;
        }
        if (rateDetail) {
            rateDetail.textContent = `${loggedDays} of ${totalDays} days logged`;
        }
    },

    /**
     * Calculate current streak
     * @param {Array} entries - Sorted entries array
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
        let startDateKey;
        let currentDate;
        
        if (entryDates.has(todayDateKey)) {
            // If today has an entry, start from today
            startDateKey = todayDateKey;
            currentDate = new Date(todayDate);
        } else if (entryDates.has(yesterdayDateKey)) {
            // If today doesn't have entry but yesterday does, start from yesterday
            startDateKey = yesterdayDateKey;
            currentDate = new Date(yesterdayDate);
        } else {
            // If neither today nor yesterday has entry, streak is 0
            return 0;
        }

        // Count consecutive days backwards from startDateKey
        let streak = 0;
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
     * Update weekly trend comparison
     */
    updateWeeklyTrend() {
        if (!this.entries || this.entries.length === 0) {
            const trendCard = document.querySelector('.insights-grid .insight-card:nth-child(4)');
            if (trendCard) {
                trendCard.querySelector('.insight-text').textContent = 'No data';
                trendCard.querySelector('.insight-detail').textContent = 'No entries yet';
                trendCard.querySelector('.insight-content').classList.remove('positive', 'negative');
            }
            return;
        }

        const today = Utils.getTodayInTimezone();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const sevenDaysKey = Utils.getDateKey(sevenDaysAgo);
        const fourteenDaysKey = Utils.getDateKey(fourteenDaysAgo);

        // Split into current week and previous week
        const currentWeek = this.entries.filter(e => e.dateKey > sevenDaysKey);
        const previousWeek = this.entries.filter(e => e.dateKey >= fourteenDaysKey && e.dateKey <= sevenDaysKey);

        const currentAvg = this.calculateAverageMood(currentWeek);
        const previousAvg = this.calculateAverageMood(previousWeek);

        const trendCard = document.querySelector('.insights-grid .insight-card:nth-child(4)');
        if (trendCard && currentAvg && previousAvg) {
            const difference = (currentAvg - previousAvg).toFixed(1);
            const isPositive = difference >= 0;
            
            const content = trendCard.querySelector('.insight-content');
            content.classList.remove('positive', 'negative');
            content.classList.add(isPositive ? 'positive' : 'negative');

            trendCard.querySelector('.insight-icon').textContent = isPositive ? '📈' : '📉';
            trendCard.querySelector('.insight-text').textContent = 
                `${isPositive ? '+' : ''}${difference}`;
        } else if (trendCard) {
            trendCard.querySelector('.insight-text').textContent = 'N/A';
            trendCard.querySelector('.insight-detail').textContent = 'Not enough data';
        }
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
