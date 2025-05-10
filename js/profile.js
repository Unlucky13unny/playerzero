document.addEventListener('DOMContentLoaded', function() {
    // Set up copy button
    document.querySelector('.copy-button').addEventListener('click', function() {
        const code = document.querySelector('.friend-code').textContent;
        navigator.clipboard.writeText(code)
            .then(() => alert('Friend code copied!'))
            .catch(err => console.error('Failed to copy: ', err));
    });
    
    // Set up radar chart
    const ctx = document.getElementById('radar-chart');
    if (ctx) {
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Walker', 'Catcher', 'Explorer', 'Grinder'],
                datasets: [{
                    label: 'Play Style',
                    data: [75, 85, 65, 90],
                    backgroundColor: 'rgba(227, 6, 19, 0.15)',
                    borderColor: 'rgba(227, 6, 19, 0.8)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(227, 6, 19, 1)',
                    pointBorderColor: '#fff'
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: { 
                            stepSize: 20,
                            backdropColor: 'transparent'
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
});
