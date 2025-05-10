/**
 * JavaScript for PlayerZero Profile Page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Set up radar chart for play style
    setupRadarChart();
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
            backgroundColor: 'rgba(227, 6, 19, 0.15)', // More transparent
            borderColor: 'rgba(227, 6, 19, 0.8)', // Slightly transparent for modern look
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
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)', // Lighter lines for modern look
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)', // Very light grid lines
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        stepSize: 20,
                        backdropColor: 'transparent', // Remove background
                        color: '#757575', // Medium gray for ticks
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // No legend for cleaner look
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: '#e0e0e0',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.raw + '/100';
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
