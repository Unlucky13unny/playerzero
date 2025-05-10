/**
 * JavaScript for PlayerZero Profile Page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded properly. Please check the script inclusion.');
        // Try loading it dynamically as a fallback
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
        script.onload = function() {
            console.log('Chart.js loaded dynamically');
            setupRadarChart();
        };
        document.head.appendChild(script);
    } else {
        console.log('Chart.js already loaded');
        // Set up radar chart for play style
        setupRadarChart();
    }
});

/**
 * Create the radar chart for play style analysis
 */
function setupRadarChart() {
    const ctx = document.getElementById('radarChart');
    if (!ctx) {
        console.error('Radar chart canvas element not found');
        return; // Exit if element doesn't exist
    }
    
    console.log('Found radar chart canvas element');
    
    // Try to get the context
    let context;
    try {
        context = ctx.getContext('2d');
        if (!context) {
            console.error('Could not get canvas context');
            return;
        }
    } catch (error) {
        console.error('Error getting canvas context:', error);
        return;
    }
    
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
            pointHoverBorderColor: 'rgba(227, 6, 19, 1)',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };
    
    const config = {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                    beginAtZero: true,
                    ticks: {
                        stepSize: 20,
                        backdropColor: 'transparent', // Remove background
                        color: '#757575', // Medium gray for ticks
                        font: {
                            size: 10
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#757575'
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
    
    // Try to create the chart with error handling
    try {
        const chart = new Chart(ctx, config);
        console.log('Radar chart successfully initialized');
    } catch (error) {
        console.error('Failed to create radar chart:', error);
        
        // Add a fallback message if chart creation fails
        const chartColumn = ctx.parentElement;
        if (chartColumn) {
            const errorMessage = document.createElement('div');
            errorMessage.style.textAlign = 'center';
            errorMessage.style.color = '#e30613';
            errorMessage.innerHTML = 'Chart could not be displayed.<br>Please refresh the page or check your browser settings.';
            chartColumn.appendChild(errorMessage);
        }
    }
}

/**
 * Copy friend code to clipboard
 */
function copyToClipboard(text) {
    // Use navigator.clipboard API if available
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification('Friend code copied!', 'success');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                // Fallback method
                copyToClipboardFallback(text);
            });
    } else {
        // Fallback for browsers that don't support clipboard API
        copyToClipboardFallback(text);
    }
}

/**
 * Fallback method for copying to clipboard using a temporary input element
 */
function copyToClipboardFallback(text) {
    const tempInput = document.createElement('input');
    tempInput.style.position = 'absolute';
    tempInput.style.left = '-1000px';
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Friend code copied!', 'success');
        } else {
            showNotification('Failed to copy friend code', 'error');
        }
    } catch (err) {
        console.error('Fallback copying method failed:', err);
        showNotification('Failed to copy friend code', 'error');
    }
    
    document.body.removeChild(tempInput);
}

/**
 * Show notification to user
 */
function showNotification(message, type = '') {
    const notification = document.getElementById('notification') || createNotification();
    notification.textContent = message;
    notification.className = ''; // Clear existing classes
    
    if (type) {
        notification.classList.add(type);
    }
    
    notification.classList.add('show');
    
    // Hide notification after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

/**
 * Create notification element if it doesn't exist
 */
function createNotification() {
    const notification = document.createElement('div');
    notification.id = 'notification';
    document.body.appendChild(notification);
    return notification;
}
