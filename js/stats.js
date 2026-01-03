/**
 * Stats View Module
 * Handles charts and statistics display
 */

const StatsView = {
    currentRange: '30',
    entries: [],

    /**
     * Initialize Stats view
     */
    init() {
        const statsDateRange = document.getElementById('statsDateRange');
        const statsApplyRange = document.getElementById('statsApplyRange');

        if (statsDateRange) {
            statsDateRange.addEventListener('change', () => this.handleRangeChange());
        }

        if (statsApplyRange) {
            statsApplyRange.addEventListener('click', () => this.handleApplyCustomRange());
        }
    },

    /**
     * Refresh Stats view
     */
    async refresh() {
        await this.loadDataForRange(this.currentRange);
    },

    /**
     * Handle range selection change
     */
    handleRangeChange() {
        const statsDateRange = document.getElementById('statsDateRange');
        const statsCustomRange = document.getElementById('statsCustomRange');
        
        if (!statsDateRange || !statsCustomRange) return;
        
        const value = statsDateRange.value;

        if (value === 'custom') {
            statsCustomRange.classList.remove('hidden');
        } else {
            statsCustomRange.classList.add('hidden');
            this.currentRange = value;
            this.loadDataForRange(value);
        }
    },

    /**
     * Handle custom range apply
     */
    handleApplyCustomRange() {
        const startDate = document.getElementById('statsStartDate').value;
        const endDate = document.getElementById('statsEndDate').value;

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
                this.updateCharts([]);
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

            console.log(`[Stats] Loading range: ${range} days, from ${startDateKey} to ${endDateKey}`);

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

            console.log(`[Stats] Loaded ${entries.length} entries for range: ${range} (${startDateKey} to ${endDateKey})`);
            this.updateCharts(entries);
        } catch (error) {
            console.error('Error loading data for range:', error);
            this.updateCharts([]);
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
                this.updateCharts([]);
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

            console.log(`[Stats] Loaded ${entries.length} entries for custom range: ${startDate} - ${endDate}`);
            this.updateCharts(entries);
        } catch (error) {
            console.error('Error loading data for custom range:', error);
            this.updateCharts([]);
        }
    },

    /**
     * Update all charts
     * @param {Array} entries - Array of mood entries
     */
    updateCharts(entries) {
        this.entries = entries;
        this.updateMoodDistribution();
        this.updateMoodTrend();
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
        
        // Update each bar in Stats view
        const statsView = document.getElementById('statsView');
        if (!statsView) return;
        
        const barItems = statsView.querySelectorAll('.bar-item');
        barItems.forEach((barItem, index) => {
            const moodType = index + 1;
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
        const trendContainer = document.querySelector('#statsTrendChart');
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

        // Mood color mapping
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

        // Draw grid lines
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

        // Update SVG
        svg.setAttribute('shape-rendering', 'geometricPrecision');
        svg.innerHTML = `
            ${gridLines.join('')}
            ${lineSegments.join('')}
            ${circles}
        `;

        // Update trend labels
        const statsView = document.getElementById('statsView');
        if (!statsView) return;
        
        const trendLabelsContainer = statsView.querySelector('.trend-labels');
        if (trendLabelsContainer && points.length > 0) {
            const firstDate = Utils.parseDateKey(points[0].date);
            const lastDate = Utils.parseDateKey(points[points.length - 1].date);
            
            let labelsHTML = '';
            if (points.length === 1) {
                const dateLabel = firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                labelsHTML = `<span>${dateLabel}</span>`;
            } else if (points.length === 2) {
                const firstLabel = firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const lastLabel = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                labelsHTML = `<span>${firstLabel}</span><span>${lastLabel}</span>`;
            } else {
                const middleIndex = Math.floor(points.length / 2);
                const middleDate = Utils.parseDateKey(points[middleIndex].date);
                
                const firstLabel = firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const middleLabel = middleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const lastLabel = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                labelsHTML = `<span>${firstLabel}</span><span>${middleLabel}</span><span>${lastLabel}</span>`;
            }
            trendLabelsContainer.innerHTML = labelsHTML;
        }
    }
};

// Export for use in other modules
window.StatsView = StatsView;
