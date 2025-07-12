/**
 * JavaScript for PlayerZero Leaderboard Page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Set up tab switching
    setupTabs();
    
    // Load example leaderboard data
    loadExampleLeaderboard();
});

/**
 * Setup tab switching functionality
 */
function setupTabs() {
    // Main tabs (All-Time vs Weekly)
    const mainTabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.leaderboard-content');
    
    mainTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            mainTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show the selected tab content
            const targetTab = tab.getAttribute('data-tab');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
    
    // Category tabs (PlayerZero Score, Distance, etc.)
    const categoryTabs = document.querySelectorAll('.category-btn');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all category tabs
            categoryTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // This would fetch and display the leaderboard for the selected category
            const category = tab.getAttribute('data-category');
            loadLeaderboard(category);
        });
    });
}

/**
 * Load example leaderboard data (for demonstration)
 */
function loadExampleLeaderboard() {
    // Example leaderboard data - this would come from your database in a real implementation
    const leaderboardData = {
        allTime: [
            { rank: 1, name: 'LumbrJackson', team: 'instinct', level: 50, score: 1785.42 },
            { rank: 2, name: 'PokeGrinder42', team: 'valor', level: 50, score: 1742.18 },
            { rank: 3, name: 'XPHunter99', team: 'mystic', level: 48, score: 1703.56 },
            { rank: 4, name: 'WalkerDude', team: 'instinct', level: 50, score: 1687.29 },
            { rank: 5, name: 'PokeMaster2023', team: 'valor', level: 49, score: 1645.73 },
        ],
        weekly: [
            { rank: 1, name: 'XPHunter99', team: 'mystic', level: 48, gain: 25 },
            { rank: 2, name: 'NewTrainer2023', team: 'valor', level: 37, gain: 21 },
            { rank: 3, name: 'GottaCatchAll', team: 'instinct', level: 42, gain: 18 },
            { rank: 4, name: 'PoGoFanatic', team: 'mystic', level: 45, gain: 15 },
            { rank: 5, name: 'LumbrJackson', team: 'instinct', level: 50, gain: 12 },
        ]
    };
    
    // For now, we'll just console log the data to show it loaded
    console.log('Leaderboard data loaded:', leaderboardData);
    
    // In a real implementation, this would update the leaderboard tables
    // updateLeaderboardTables(leaderboardData);
}

/**
 * Load leaderboard data for a specific category
 * @param {string} category - Category to load (playerzero, distance, catches, etc.)
 */
function loadLeaderboard(category) {
    // This would fetch leaderboard data from the server for the selected category
    console.log('Loading leaderboard for category:', category);
    
    // For now, we'll show a notification about the category change
    showNotification('Leaderboard updated to show ' + getCategoryName(category), 'info');
}

/**
 * Get readable name for a category
 * @param {string} category - Category key
 * @return {string} Human-readable category name
 */
function getCategoryName(category) {
    const categories = {
        'playerzero': 'PlayerZero Score',
        'distance': 'Distance Walked',
        'catches': 'Pokémon Caught',
        'pokestops': 'Pokéstops Visited',
        'xp': 'Total XP'
    };
    
    return categories[category] || category;
}

// Event listeners for leaderboard controls
document.addEventListener('DOMContentLoaded', function() {
    // Search button
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchTerm = document.getElementById('player-search').value.trim();
            if (searchTerm) {
                // This would search for a player
                console.log('Searching for player:', searchTerm);
                showNotification('Searching for "' + searchTerm + '"...', 'info');
            }
        });
    }

    // Find my rank button
    const findMeBtn = document.getElementById('find-me-btn');
    if (findMeBtn) {
        findMeBtn.addEventListener('click', () => {
            // This would find the current user's rank
            console.log('Finding your rank');
            showNotification('In a real implementation, this would scroll to your position', 'info');
        });
    }

    // Team filter
    const teamSelect = document.getElementById('team-select');
    if (teamSelect) {
        teamSelect.addEventListener('change', (e) => {
            const team = e.target.value;
            console.log('Filtering by team:', team);
            showNotification('Filtered to show ' + (team === 'all' ? 'all teams' : 'Team ' + team), 'info');
        });
    }
});
