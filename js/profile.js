/**
 * JavaScript for PlayerZero Profile Page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Set up radar chart for play style
    setupRadarChart();
    
    // Load example profile data
    loadExampleProfile();
});

/**
 * Create the radar chart for play style analysis
 */
function setupRadarChart() {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return; // Exit if element doesn't exist
    
    // Sample data - this would be calculated based on player stats
    const data = {
        labels: ['Walker', 'Catcher', 'Explorer', 'Grinder'],
        datasets: [{
            label: 'Play Style',
            data: [75, 85, 65, 90], // Normalized scores for each category
            backgroundColor: 'rgba(227, 6, 19, 0.2)', // PlayerZero red with transparency
            borderColor: 'rgba(227, 6, 19, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(227, 6, 19, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(227, 6, 19, 1)'
        }]
    };
    
    const config = {
        type: 'radar',
        data: data,
        options: {
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + '/100';
                        }
                    }
                }
            }
        }
    };
    
    // Check if Chart.js is loaded
    if (typeof Chart !== 'undefined') {
        new Chart(ctx, config);
    } else {
        console.error('Chart.js not loaded');
    }
}

/**
 * Load example profile data (for demonstration)
 */
function loadExampleProfile() {
    // Example player data - this would come from your database in a real implementation
    const playerData = {
        name: 'LumbrJackson',
        team: 'instinct',
        level: 50,
        startDate: '2016-07-10',
        friendCode: '1234 5678 9012',
        stats: {
            distanceWalked: 15019.30,
            pokemonCaught: 170216,
            pokestopsVisited: 109998,
            totalXP: 212130283
        },
        weeklyGains: {
            distanceWalked: 32.5,
            pokemonCaught: 415,
            pokestopsVisited: 221,
            totalXP: 1254789
        },
        previousWeekGains: {
            distanceWalked: 28.7,
            pokemonCaught: 382,
            pokestopsVisited: 196,
            totalXP: 981329
        }
    };
    
    // Calculate PlayerZero score
    playerData.playerZeroScore = calculatePlayerZeroScore(playerData.stats);
    
    // Update profile with this data
    updateProfile(playerData);
}

/**
 * Update profile UI with player data
 * @param {Object} playerData - Player's profile data
 */
function updateProfile(playerData) {
    // Update basic profile information
    const elements = {
        trainerName: document.querySelector('.trainer-name'),
        trainerLevel: document.querySelector('.trainer-level span'),
        trainerSince: document.querySelector('.trainer-since'),
        friendCode: document.querySelector('.friend-code'),
        score: document.querySelector('.score')
    };
    
    // Only update elements that exist
    if (elements.trainerName) elements.trainerName.textContent = playerData.name;
    if (elements.trainerLevel) elements.trainerLevel.textContent = playerData.level;
    if (elements.trainerSince) elements.trainerSince.textContent = 'Playing since: ' + formatDate(playerData.startDate);
    if (elements.friendCode) elements.friendCode.textContent = 'Friend Code: ' + playerData.friendCode;
    if (elements.score) elements.score.textContent = playerData.playerZeroScore;
    
    // Update stats values
    const statBoxes = document.querySelectorAll('.stat-box');
    if (statBoxes.length >= 4) {
        const statValues = [
            formatNumber(playerData.stats.distanceWalked) + ' km',
            formatNumber(playerData.stats.pokemonCaught),
            formatNumber(playerData.stats.pokestopsVisited),
            formatNumber(playerData.stats.totalXP)
        ];
        
        const weeklyChanges = [
            '+' + playerData.weeklyGains.distanceWalked + ' km',
            '+' + formatNumber(playerData.weeklyGains.pokemonCaught),
            '+' + formatNumber(playerData.weeklyGains.pokestopsVisited),
            '+' + formatNumber(playerData.weeklyGains.totalXP)
        ];
        
        statBoxes.forEach((box, index) => {
            if (index < 4) {
                const valueElement = box.querySelector('.stat-value');
                const changeElement = box.querySelector('.stat-change');
                
                if (valueElement) valueElement.textContent = statValues[index];
                if (changeElement) {
                    changeElement.textContent = weeklyChanges[index] + ' this week';
                    changeElement.classList.add('positive');
                }
            }
        });
    }
    
    // Update weekly update cards (for a real implementation)
    // updateWeeklyCards(playerData.weeklyUpdates);
}

/**
 * Calculate normalized play style values for radar chart
 * @param {Object} stats - Player's stats
 * @return {Array} Normalized values for radar chart
 */
function calculatePlayStyle(stats) {
    // These thresholds would be adjusted based on your player base
    const maxDistance = 20000; // km
    const maxCaught = 200000; // Pokémon
    const maxPokestops = 150000; // Pokéstops
    const maxXP = 300000000; // XP
    
    // Calculate normalized scores (0-100)
    const walker = Math.min(100, (stats.distanceWalked / maxDistance) * 100);
    const catcher = Math.min(100, (stats.pokemonCaught / maxCaught) * 100);
    const explorer = Math.min(100, (stats.pokestopsVisited / maxPokestops) * 100);
    const grinder = Math.min(100, (stats.totalXP / maxXP) * 100);
    
    return [walker, catcher, explorer, grinder];
}
