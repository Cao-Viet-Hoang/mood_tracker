/**
 * Today View Module
 * Handles mood selection, note input, and saving entries for today
 */

const TodayView = {
    selectedMood: null,

    /**
     * Initialize Today view
     */
    init() {
        const elements = UI.getElements();

        // Initialize mood selector
        const moodBtns = document.querySelectorAll('#todayView .mood-btn');
        moodBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectMood(btn, moodBtns));
        });

        // Save button
        elements.saveMoodBtn.addEventListener('click', () => this.handleSaveMood());

        // Initial update
        this.updateTodayDate();
    },

    /**
     * Refresh Today view
     */
    async refresh() {
        this.updateTodayDate();
        await this.loadTodayEntry();
    },

    /**
     * Update the displayed date
     */
    updateTodayDate() {
        const elements = UI.getElements();
        const today = Utils.getTodayInTimezone();
        elements.currentDate.textContent = Utils.formatDate(today);
    },

    /**
     * Handle mood button selection
     * @param {HTMLElement} selectedBtn - Selected button
     * @param {NodeList} allBtns - All mood buttons
     */
    selectMood(selectedBtn, allBtns) {
        allBtns.forEach(btn => btn.classList.remove('selected'));
        selectedBtn.classList.add('selected');
        this.selectedMood = parseInt(selectedBtn.dataset.mood);
    },

    /**
     * Handle save mood button click
     */
    async handleSaveMood() {
        if (!this.selectedMood) {
            UI.showToast('Please select a mood first', 'error');
            return;
        }

        const elements = UI.getElements();

        // Show loading state
        UI.setButtonLoading(elements.saveMoodBtn, true);

        try {
            const userId = Auth.getUserId();
            if (!userId) {
                throw new Error('Not authenticated');
            }

            const db = FirebaseConfig.getDb();
            const today = Utils.getTodayInTimezone();
            const dateKey = Utils.getDateKey(today);
            const note = elements.moodNote.value.trim();

            // Create entry object
            const entry = {
                dateKey: dateKey,
                moodType: this.selectedMood,
                note: note || ''
            };

            // Save to Firestore: accounts/{userId}/entries/{dateKey}
            await db.collection('accounts')
                .doc(userId)
                .collection('entries')
                .doc(dateKey)
                .set(entry, { merge: true });

            // Update streak cache after saving entry
            try {
                await StreakManager.updateStreakOnEntryChange(userId);
            } catch (streakError) {
                console.error('[Today] Error updating streak cache:', streakError);
                // Don't throw - entry was saved successfully
            }

            // Update current entry display
            this.updateCurrentEntry();

            UI.showToast('Entry saved successfully!');
        } catch (error) {
            console.error('Error saving mood:', error);
            UI.showToast('Failed to save entry', 'error');
        } finally {
            UI.setButtonLoading(elements.saveMoodBtn, false);
        }
    },

    /**
     * Update the current entry display card
     */
    updateCurrentEntry() {
        if (!this.selectedMood) return;

        const elements = UI.getElements();
        const mood = Utils.getMoodData(this.selectedMood);
        const note = elements.moodNote.value;

        elements.currentEntry.querySelector('.entry-mood-icon').textContent = mood.icon;
        elements.currentEntry.querySelector('.entry-mood-label').textContent = mood.label;
        elements.currentEntry.querySelector('.entry-time').textContent = `Saved at ${Utils.formatTime(new Date())}`;
        elements.currentEntry.querySelector('.entry-note').textContent = note || 'No note added';

        elements.currentEntry.classList.remove('hidden');
    },

    /**
     * Get selected mood
     * @returns {number|null} Selected mood type
     */
    getSelectedMood() {
        return this.selectedMood;
    },

    /**
     * Set mood selection (for loading existing entry)
     * @param {number} moodType - Mood type (1-5)
     */
    setMood(moodType) {
        const moodBtns = document.querySelectorAll('#todayView .mood-btn');
        moodBtns.forEach(btn => {
            btn.classList.toggle('selected', parseInt(btn.dataset.mood) === moodType);
        });
        this.selectedMood = moodType;
    },

    /**
     * Set note text
     * @param {string} note - Note text
     */
    setNote(note) {
        const elements = UI.getElements();
        elements.moodNote.value = note || '';
    },

    /**
     * Clear the form
     */
    clearForm() {
        const moodBtns = document.querySelectorAll('#todayView .mood-btn');
        moodBtns.forEach(btn => btn.classList.remove('selected'));
        this.selectedMood = null;

        const elements = UI.getElements();
        elements.moodNote.value = '';
        elements.currentEntry.classList.add('hidden');
    },

    /**
     * Load existing entry for today from Firestore
     */
    async loadTodayEntry() {
        try {
            const userId = Auth.getUserId();
            if (!userId) {
                return;
            }

            const db = FirebaseConfig.getDb();
            const today = Utils.getTodayInTimezone();
            const dateKey = Utils.getDateKey(today);

            // Get entry from Firestore
            const docRef = db.collection('accounts')
                .doc(userId)
                .collection('entries')
                .doc(dateKey);

            const snapshot = await docRef.get();

            if (snapshot.exists) {
                const entry = snapshot.data();

                // Load mood and note
                this.setMood(entry.moodType);
                this.setNote(entry.note);

                // Update current entry display
                this.updateCurrentEntry();
            } else {
                // No entry for today, clear form
                this.clearForm();
            }
        } catch (error) {
            console.error('Error loading today entry:', error);
        }
    }
};

// Export for use in other modules
window.TodayView = TodayView;
