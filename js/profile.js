document.addEventListener('DOMContentLoaded', function() {
    // Set up radar chart for play style
    setupRadarChart();
});

// Create the radar chart for play style analysis
function setupRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
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
    
    new Chart(ctx, config);
}

// This function would be called when we have actual player data
function updateProfile(playerData) {
    // Update profile information
    document.querySelector('.trainer-name').textContent = playerData.name;
    document.querySelector('.trainer-level span').textContent = playerData.level;
    document.querySelector('.trainer-since').textContent = 'Playing since: ' + formatDate(playerData.startDate);
    document.querySelector('.friend-code').textContent = 'Friend Code: ' + playerData.friendCode;
    
    // Update stats
    document.querySelector('.stat-value:nth-of-type(1)').textContent = formatNumber(playerData.stats.distanceWalked) + ' km';
    document.querySelector('.stat-value:nth-of-type(2)').textContent = formatNumber(playerData.stats.pokemonCaught);
    document.querySelector('.stat-value:nth-of-type(3)').textContent = formatNumber(playerData.stats.pokestopsVisited);
    document.querySelector('.stat-value:nth-of-type(4)').textContent = formatNumber(playerData.stats.totalXP);
    
    // Update PlayerZero score
    document.querySelector('.score').textContent = playerData.playerZeroScore;
    
    // This would update the radar chart with actual player data
    // updateRadarChart(playerData.playstyle);
}
