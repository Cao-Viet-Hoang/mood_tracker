/**
 * Navigation Module
 * Handles view switching and navigation state
 */

const Navigation = {
    currentView: 'today',

    /**
     * Initialize navigation
     */
    init() {
        const elements = UI.getElements();

        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.switchView(view);
            });
        });
    },

    /**
     * Switch to a different view
     * @param {string} viewName - View name ('today' | 'calendar' | 'dashboard' | 'stats')
     */
    async switchView(viewName) {
        const elements = UI.getElements();

        // Update nav items
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Trigger view-specific updates BEFORE showing the view
        await this.onViewChanged(viewName);

        // Update views AFTER data is loaded
        elements.todayView.classList.toggle('active', viewName === 'today');
        elements.todayView.classList.toggle('hidden', viewName !== 'today');

        elements.calendarView.classList.toggle('active', viewName === 'calendar');
        elements.calendarView.classList.toggle('hidden', viewName !== 'calendar');

        elements.dashboardView.classList.toggle('active', viewName === 'dashboard');
        elements.dashboardView.classList.toggle('hidden', viewName !== 'dashboard');

        elements.statsView.classList.toggle('active', viewName === 'stats');
        elements.statsView.classList.toggle('hidden', viewName !== 'stats');

        this.currentView = viewName;
    },

    /**
     * Called when view changes
     * @param {string} viewName - New view name
     */
    async onViewChanged(viewName) {
        switch (viewName) {
            case 'today':
                await TodayView.refresh();
                break;
            case 'calendar':
                await CalendarView.refresh();
                break;
            case 'dashboard':
                await DashboardView.refresh();
                break;
            case 'stats':
                await StatsView.refresh();
                break;
        }
    },

    /**
     * Get current view name
     * @returns {string} Current view name
     */
    getCurrentView() {
        return this.currentView;
    }
};

// Export for use in other modules
window.Navigation = Navigation;
