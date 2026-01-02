/**
 * Calendar View Module
 * Handles calendar display, navigation, and entry editing
 */

const CalendarView = {
    currentDate: new Date(),
    selectedDate: null,
    entries: {}, // Cache for mood entries

    /**
     * Initialize Calendar view
     */
    init() {
        const elements = UI.getElements();

        // Month navigation
        elements.prevMonth.addEventListener('click', () => this.navigateMonth(-1));
        elements.nextMonth.addEventListener('click', () => this.navigateMonth(1));

        // Calendar day clicks
        elements.calendarGrid.addEventListener('click', (e) => {
            const dayEl = e.target.closest('.calendar-day');
            if (dayEl && !dayEl.classList.contains('other-month')) {
                this.handleDayClick(dayEl);
            }
        });

        // Edit modal handlers
        elements.closeEditModal.addEventListener('click', () => this.closeEditModal());
        elements.cancelEdit.addEventListener('click', () => this.closeEditModal());
        elements.saveEdit.addEventListener('click', () => this.handleSaveEdit());
        elements.editModal.querySelector('.modal-overlay').addEventListener('click', () => this.closeEditModal());

        // Edit modal mood selector
        const editMoodBtns = elements.editModal.querySelectorAll('.mood-btn');
        editMoodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                editMoodBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // Initial render
        this.updateCalendarHeader();
    },

    /**
     * Refresh Calendar view
     */
    refresh() {
        this.updateCalendarHeader();
        // TODO: Regenerate calendar grid with entries from Firebase
    },

    /**
     * Navigate to previous/next month
     * @param {number} direction - Direction (-1 for prev, 1 for next)
     */
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.updateCalendarHeader();
        this.renderCalendar();
    },

    /**
     * Update calendar header with current month/year
     */
    updateCalendarHeader() {
        const elements = UI.getElements();
        elements.calendarMonth.textContent = this.currentDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
            timeZone: Utils.TIMEZONE
        });
    },

    /**
     * Render the calendar grid
     */
    renderCalendar() {
        const elements = UI.getElements();
        const grid = elements.calendarGrid;

        // Clear existing days
        grid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = Utils.getFirstDayOfMonth(this.currentDate);
        const daysInMonth = Utils.getDaysInMonth(this.currentDate);
        const daysInPrevMonth = Utils.getDaysInMonth(new Date(year, month - 1));

        const today = Utils.getTodayInTimezone();
        const todayKey = Utils.getDateKey(today);

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayEl = this.createDayElement(day, true);
            grid.appendChild(dayEl);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = Utils.getDateKey(date);
            const isToday = dateKey === todayKey;
            const entry = this.entries[dateKey];

            const dayEl = this.createDayElement(day, false, isToday, entry);
            dayEl.dataset.date = dateKey;
            grid.appendChild(dayEl);
        }

        // Next month days (fill remaining cells)
        const totalCells = grid.children.length;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let day = 1; day <= remainingCells; day++) {
            const dayEl = this.createDayElement(day, true);
            grid.appendChild(dayEl);
        }
    },

    /**
     * Create a calendar day element
     * @param {number} day - Day number
     * @param {boolean} isOtherMonth - Is from another month
     * @param {boolean} isToday - Is today
     * @param {Object} entry - Mood entry if exists
     * @returns {HTMLElement} Day element
     */
    createDayElement(day, isOtherMonth = false, isToday = false, entry = null) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';

        if (isOtherMonth) {
            dayEl.classList.add('other-month');
        }
        if (isToday) {
            dayEl.classList.add('today');
        }
        if (entry) {
            dayEl.classList.add('has-mood', `mood-${entry.moodType}`);
        }

        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayEl.appendChild(dayNumber);

        if (entry && !isOtherMonth) {
            const moodIcon = document.createElement('span');
            moodIcon.className = 'day-mood';
            moodIcon.textContent = Utils.getMoodData(entry.moodType).icon;
            dayEl.appendChild(moodIcon);
        }

        return dayEl;
    },

    /**
     * Handle day click
     * @param {HTMLElement} dayEl - Clicked day element
     */
    handleDayClick(dayEl) {
        const dateKey = dayEl.dataset.date;
        if (!dateKey) return;

        this.selectedDate = dateKey;
        this.openEditModal(dateKey, dayEl);
    },

    /**
     * Open edit modal for a specific date
     * @param {string} dateKey - Date key
     * @param {HTMLElement} dayEl - Day element
     */
    openEditModal(dateKey, dayEl) {
        const elements = UI.getElements();
        const date = Utils.parseDateKey(dateKey);

        elements.editDate.textContent = Utils.formatDate(date);

        // Reset mood selection
        const editMoodBtns = elements.editModal.querySelectorAll('.mood-btn');
        editMoodBtns.forEach(btn => btn.classList.remove('selected'));

        // Pre-select mood if entry exists
        if (dayEl.classList.contains('has-mood')) {
            for (let i = 1; i <= 5; i++) {
                if (dayEl.classList.contains(`mood-${i}`)) {
                    const btn = elements.editModal.querySelector(`[data-mood="${i}"]`);
                    if (btn) btn.classList.add('selected');
                    break;
                }
            }
        }

        // Load note if exists
        const entry = this.entries[dateKey];
        elements.editNote.value = entry?.note || '';

        UI.openModal(elements.editModal);
    },

    /**
     * Close edit modal
     */
    closeEditModal() {
        const elements = UI.getElements();
        UI.closeModal(elements.editModal);
        this.selectedDate = null;
    },

    /**
     * Handle save edit
     */
    async handleSaveEdit() {
        const elements = UI.getElements();
        const selectedBtn = elements.editModal.querySelector('.mood-btn.selected');

        if (!selectedBtn) {
            UI.showToast('Please select a mood', 'error');
            return;
        }

        const moodType = parseInt(selectedBtn.dataset.mood);
        const note = elements.editNote.value;

        // Show loading
        elements.saveEdit.disabled = true;
        elements.saveEdit.textContent = 'Saving...';

        try {
            // TODO: Save to Firebase
            await new Promise(resolve => setTimeout(resolve, 800));

            // Update local cache
            this.entries[this.selectedDate] = {
                moodType,
                note,
                dateKey: this.selectedDate
            };

            // Re-render calendar
            this.renderCalendar();

            this.closeEditModal();
            UI.showToast('Entry updated successfully!');
        } catch (error) {
            console.error('Error saving entry:', error);
            UI.showToast('Failed to save entry', 'error');
        } finally {
            elements.saveEdit.disabled = false;
            elements.saveEdit.textContent = 'Save Changes';
        }
    },

    /**
     * Set entries data (from Firebase)
     * @param {Object} entries - Entries object keyed by dateKey
     */
    setEntries(entries) {
        this.entries = entries || {};
        this.renderCalendar();
    },

    /**
     * Get current displayed month/year
     * @returns {Object} { month, year }
     */
    getCurrentMonth() {
        return {
            month: this.currentDate.getMonth(),
            year: this.currentDate.getFullYear()
        };
    }
};

// Export for use in other modules
window.CalendarView = CalendarView;
