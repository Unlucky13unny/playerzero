<script>
    document.addEventListener('DOMContentLoaded', function() {
        // File preview functionality
        setupFilePreviews();
        
        // Set up modal
        setupModal();
        
        // Set up button click handlers
        setupButtonHandlers();
    });
    
    function setupFilePreviews() {
        var startImage = document.getElementById('startImage');
        var endImage = document.getElementById('endImage');
        var startPreview = document.getElementById('startPreview');
        var endPreview = document.getElementById('endPreview');
        
        if (startImage && startPreview) {
            startImage.addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        startPreview.src = e.target.result;
                        startPreview.style.display = 'block';
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        }
        
        if (endImage && endPreview) {
            endImage.addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        endPreview.src = e.target.result;
                        endPreview.style.display = 'block';
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        }
    }
    
    function setupModal() {
        var modal = document.getElementById('prizeInfoModal');
        var btn = document.getElementById('prizeInfoBtn');
        var closeBtn = document.getElementById('closeModal');
        
        if (btn && modal && closeBtn) {
            btn.addEventListener('click', function() {
                modal.style.display = 'block';
            });
            
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
            
            window.addEventListener('click', function(event) {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }
    
    function setupButtonHandlers() {
        // Submit screenshots button
        var submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', handleSubmitScreenshots);
        }
        
        // Calculate stats button
        var calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', calculateStats);
        }
        
        // Download card button
        var downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadCard);
        }
    }
    
    function handleSubmitScreenshots() {
        var feedback = document.getElementById('ocrFeedback');
        var startFile = document.getElementById('startImage').files;
        var endFile = document.getElementById('endImage').files;
        
        // Validate inputs
        if (!startFile.length || !endFile.length) {
            feedback.className = 'feedback error';
            feedback.textContent = 'Please upload both start and end screenshots.';
            return;
        }
        
        // Show processing feedback
        feedback.className = 'feedback processing';
        feedback.innerHTML = '<div class="loading-spinner"></div> Processing your screenshots...';
        
        // Simulate processing with a timeout
        setTimeout(function() {
            feedback.className = 'feedback success';
            feedback.textContent = 'Thank you for contributing your screenshots! Please continue below with manual entry of your comm day statistics.';
            
            // Scroll to the manual entry section
            var sections = document.getElementsByClassName('manual-input-section');
            if (sections.length > 1) {
                sections[1].scrollIntoView({behavior: 'smooth'});
            }
        }, 1500);
    }
    
    function calculateStats() {
        // Get values from form
        var trainerName = document.getElementById('trainerName').value || 'pgPlayerZero';
        var pokemonName = document.getElementById('pokemonName').value || 'POKEMON';
        var hoursPlayed = parseFloat(document.getElementById('hoursPlayed').value) || 0;
        var startSeen = parseInt(document.getElementById('startSeen').value) || 0;
        var endSeen = parseInt(document.getElementById('endSeen').value) || 0;
        var startCaught = parseInt(document.getElementById('startCaught').value) || 0;
        var endCaught = parseInt(document.getElementById('endCaught').value) || 0;
        var shinyCount = parseInt(document.getElementById('shinyCount').value) || 0;
        
        // Validate inputs
        if (!trainerName || !pokemonName || hoursPlayed <= 0) {
            alert('Please fill in all trainer information fields.');
            return;
        }
        
        if (startSeen >= endSeen || startCaught >= endCaught) {
            alert('End values must be greater than start values.');
            return;
        }
        
        // Calculate stats
        var totalSeen = endSeen - startSeen;
        var totalCaught = endCaught - startCaught;
        var catchRate = Math.round((totalCaught / totalSeen) * 100);
        var caughtPerHour = (totalCaught / hoursPlayed).toFixed(1);
        
        // Update card
        document.getElementById('trainerDisplay').textContent = trainerName;
        document.getElementById('pokemonDisplay').textContent = pokemonName.toUpperCase();
        document.getElementById('deltaCaught').textContent = totalCaught;
        document.getElementById('catchPercent').textContent = catchRate + '%';
        document.getElementById('caughtPerHour').textContent = caughtPerHour;
        document.getElementById('shinyTotal').textContent = shinyCount;
        
        // Show card and download button
        document.getElementById('card').style.display = 'block';
        document.getElementById('downloadBtn').style.display = 'block';
        
        // Display stats summary
        var statsDifference = document.getElementById('statsDifference');
        if (statsDifference) {
            statsDifference.innerHTML = `<strong>Session Summary:</strong> You encountered ${totalSeen} Pokémon and caught ${totalCaught} of them. That's a ${catchRate}% catch rate!`;
            statsDifference.style.display = 'block';
        }
        
        // Scroll to results
        document.getElementById('card').scrollIntoView({behavior: 'smooth'});
    }
    
    function downloadCard() {
        var card = document.getElementById('card');
        var downloadBtn = document.getElementById('downloadBtn');
        
        // Show processing state
        var originalText = downloadBtn.textContent;
        downloadBtn.textContent = 'Processing...';
        downloadBtn.disabled = true;
        
        // Generate image
        if (typeof html2canvas !== 'undefined') {
            html2canvas(card, {
                backgroundColor: null,
                scale: 2, // Higher quality
                logging: false,
                allowTaint: true,
                useCORS: true
            }).then(function(canvas) {
                // Create download link
                var imageData = canvas.toDataURL('image/png');
                var link = document.createElement('a');
                link.download = 'PlayerZero_CommDayCard.png';
                link.href = imageData;
                link.click();
                
                // Reset button
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }).catch(function(error) {
                console.error('Error generating image:', error);
                alert('There was an error generating your image. Please try again.');
                
                // Reset button
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            });
        } else {
            alert('Image generation library not loaded. Please try again later.');
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        }
    }
    
    // Keyboard shortcuts for testing
    document.addEventListener('keydown', function(e) {
        // Press Shift+D to fill demo data
        if (e.shiftKey && e.key === 'D') {
            document.getElementById('trainerName').value = 'pgPlayerZero';
            document.getElementById('pokemonName').value = 'Pawmi';
            document.getElementById('hoursPlayed').value = '3';
            document.getElementById('startSeen').value = '125';
            document.getElementById('startCaught').value = '95';
            document.getElementById('endSeen').value = '135';
            document.getElementById('endCaught').value = '104';
            document.getElementById('shinyCount').value = '3';
        }
        
        // Press Shift+C to calculate stats with current values
        if (e.shiftKey && e.key === 'C') {
            calculateStats();
        }
    });
</script>
