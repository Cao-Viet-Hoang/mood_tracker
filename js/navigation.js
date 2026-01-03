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
    switchView(viewName) {
        const elements = UI.getElements();

        // Update nav items
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Update views
        elements.todayView.classList.toggle('active', viewName === 'today');
        elements.todayView.classList.toggle('hidden', viewName !== 'today');

        elements.calendarView.classList.toggle('active', viewName === 'calendar');
        elements.calendarView.classList.toggle('hidden', viewName !== 'calendar');

        elements.dashboardView.classList.toggle('active', viewName === 'dashboard');
        elements.dashboardView.classList.toggle('hidden', viewName !== 'dashboard');

        elements.statsView.classList.toggle('active', viewName === 'stats');
        elements.statsView.classList.toggle('hidden', viewName !== 'stats');

        this.currentView = viewName;

        // Trigger view-specific updates
        this.onViewChanged(viewName);
    },

    /**
     * Called when view changes
     * @param {string} viewName - New view name
     */
    onViewChanged(viewName) {
        switch (viewName) {
            case 'today':
                TodayView.refresh();
                break;
            case 'calendar':
                CalendarView.refresh();
                break;
            case 'dashboard':
                DashboardView.refresh();
                break;
            case 'stats':
                StatsView.refresh();
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
