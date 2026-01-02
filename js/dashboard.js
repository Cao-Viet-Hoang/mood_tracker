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
            } else {
                // Last N days
                const days = parseInt(range);
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - days + 1);
            }

            const startDateKey = Utils.getDateKey(startDate);
            const endDateKey = Utils.getDateKey(today);

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

            console.log(`Loaded ${entries.length} entries for range: ${range}`);
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
        this.updateMoodDistribution();
        this.updateMoodTrend();
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
     * Update mood distribution bar chart
     */
    updateMoodDistribution() {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        this.entries.forEach(entry => {
            if (counts[entry.moodType] !== undefined) {
                counts[entry.moodType]++;
            }
        });

        const maxCount = Math.max(...Object.values(counts), 1);
        
        // Update each bar - bars are in order 1 to 5 in HTML
        const barItems = document.querySelectorAll('.bar-item');
        barItems.forEach((barItem, index) => {
            const moodType = index + 1; // Bars are in order (1 to 5)
            const count = counts[moodType] || 0;
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            
            const fill = barItem.querySelector('.bar-fill');
            const valueSpan = barItem.querySelector('.bar-value');
            
            if (fill) fill.style.height = `${percentage}%`;
            if (valueSpan) valueSpan.textContent = count;
        });
    },

    /**
     * Update mood trend line chart
     */
    updateMoodTrend() {
        const trendContainer = document.querySelector('#trendChart');
        if (!trendContainer) return;
        
        const svg = trendContainer.querySelector('svg');
        if (!svg) return;

        if (!this.entries || this.entries.length === 0) {
            // Show empty state
            svg.innerHTML = '<text x="150" y="50" text-anchor="middle" fill="#999" font-size="14">No data available</text>';
            return;
        }

        // Group entries by date and calculate average per day
        const dailyAverages = {};
        this.entries.forEach(entry => {
            if (!dailyAverages[entry.dateKey]) {
                dailyAverages[entry.dateKey] = { sum: 0, count: 0 };
            }
            dailyAverages[entry.dateKey].sum += entry.moodType;
            dailyAverages[entry.dateKey].count++;
        });

        // Sort by date and create points
        const sortedDates = Object.keys(dailyAverages).sort();
        const points = sortedDates.map(date => ({
            date,
            mood: dailyAverages[date].sum / dailyAverages[date].count
        }));

        if (points.length === 0) return;

        // SVG dimensions
        const width = 300;
        const height = 150;
        const paddingLeft = 10;
        const paddingRight = 10;
        const paddingTop = 15;
        const paddingBottom = 15;
        const graphWidth = width - paddingLeft - paddingRight;
        const graphHeight = height - paddingTop - paddingBottom;

        // Update SVG viewBox
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Calculate scales
        const xScale = points.length > 1 ? graphWidth / (points.length - 1) : graphWidth / 2;
        const yMin = 1;
        const yMax = 5;
        const yScale = graphHeight / (yMax - yMin);

        // Mood color mapping - darker colors for better visibility
        const getMoodColor = (moodValue) => {
            const roundedMood = Math.round(moodValue);
            const colors = {
                1: '#E88888', // Very Bad - Red
                2: '#E8A868', // Bad - Orange
                3: '#E8D868', // Okay - Yellow
                4: '#88C888', // Good - Green
                5: '#68B8B8'  // Great - Teal
            };
            return colors[roundedMood] || '#7EB8A2';
        };

        // Draw grid lines (no labels in SVG)
        const gridLines = [];
        for (let i = 1; i <= 5; i++) {
            const y = height - paddingBottom - ((i - yMin) * yScale);
            gridLines.push(`<line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#E0E0E0" stroke-width="1" stroke-dasharray="3,3" />`);
        }

        // Generate line segments with gradient colors
        const lineSegments = [];
        for (let i = 0; i < points.length - 1; i++) {
            const x1 = paddingLeft + (i * xScale);
            const y1 = height - paddingBottom - ((points[i].mood - yMin) * yScale);
            const x2 = paddingLeft + ((i + 1) * xScale);
            const y2 = height - paddingBottom - ((points[i + 1].mood - yMin) * yScale);
            const avgMood = (points[i].mood + points[i + 1].mood) / 2;
            const color = getMoodColor(avgMood);
            
            lineSegments.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" stroke-linecap="round" />`);
        }

        // Generate circles with mood-specific colors
        const circles = points.map((point, index) => {
            const x = paddingLeft + (index * xScale);
            const y = height - paddingBottom - ((point.mood - yMin) * yScale);
            const color = getMoodColor(point.mood);
            return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="white" stroke-width="1.5" />`;
        }).join('');

        // Update SVG with crisp rendering
        svg.setAttribute('shape-rendering', 'geometricPrecision');
        svg.innerHTML = `
            ${gridLines.join('')}
            ${lineSegments.join('')}
            ${circles}
        `;
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
