// Community Day Calculator functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set up file input preview functionality
    setupImagePreviews();
    
    // Setup prize info modal
    setupModal();
});

// Set up image preview functionality
function setupImagePreviews() {
    const startImageInput = document.getElementById('startImage');
    const endImageInput = document.getElementById('endImage');
    const startPreview = document.getElementById('startPreview');
    const endPreview = document.getElementById('endPreview');
    
    startImageInput.addEventListener('change', function() {
        displayImagePreview(this, startPreview);
    });
    
    endImageInput.addEventListener('change', function() {
        displayImagePreview(this, endPreview);
    });
}

// Display preview of uploaded image
function displayImagePreview(input, previewElement) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            previewElement.src = e.target.result;
            previewElement.style.display = 'block';
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('prizeInfoModal');
    const btn = document.getElementById('prizeInfoBtn');
    const closeBtn = document.getElementById('closeModal');
    
    if (btn && closeBtn && modal) {
        btn.onclick = function() {
            modal.style.display = 'block';
        };
        
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
        
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }
}

// The OCR simulation function - in a real implementation, this would call an API
function runOCR() {
    const startImage = document.getElementById('startImage');
    const endImage = document.getElementById('endImage');
    const ocrFeedback = document.getElementById('ocrFeedback');
    const statsDifference = document.getElementById('statsDifference');
    
    // Validate that both images are uploaded
    if (!startImage.files.length || !endImage.files.length) {
        ocrFeedback.textContent = 'Please upload both start and end screenshots.';
        ocrFeedback.className = 'feedback error';
        return;
    }
    
    // Show processing feedback
    ocrFeedback.innerHTML = '<div class="loading-spinner"></div> Processing your screenshots...';
    ocrFeedback.className = 'feedback processing';
    
    // Simulate processing delay
    setTimeout(function() {
        // Until a proper OCR service is implemented, we'll guide the user to use manual input
        ocrFeedback.innerHTML = '⚠️ Screenshot processing is currently being improved. Please enter your stats manually below.';
        ocrFeedback.className = 'feedback warning';
        
        // Jump to manual input section
        document.querySelector('.manual-input-section').scrollIntoView({ behavior: 'smooth' });
        
        // Focus on the first input field
        document.getElementById('trainerName').focus();
    }, 1500);
}

// Calculate and display stats
function runStats() {
    // Get values from input fields
    const trainerName = document.getElementById('trainerName').value || 'Trainer';
    const pokemonName = document.getElementById('pokemonName').value || 'Pokémon';
    const startSeen = parseInt(document.getElementById('startSeen').value) || 0;
    const endSeen = parseInt(document.getElementById('endSeen').value) || 0;
    const startCaught = parseInt(document.getElementById('startCaught').value) || 0;
    const endCaught = parseInt(document.getElementById('endCaught').value) || 0;
    const shinyCount = parseInt(document.getElementById('shinyCount').value) || 0;
    const hoursPlayed = parseFloat(document.getElementById('hoursPlayed').value) || 3;
    
    // Calculate statistics
    const deltaSeen = endSeen - startSeen;
    const deltaCaught = endCaught - startCaught;
    
    // Validate the values make sense
    if (deltaSeen < 0 || deltaCaught < 0) {
        const ocrFeedback = document.getElementById('ocrFeedback');
        ocrFeedback.innerHTML = '⚠️ Warning: Your end values are lower than start values. Did you mix up your before/after numbers?';
        ocrFeedback.className = 'feedback warning';
        ocrFeedback.style.display = 'block';
        return;
    }
    
    // Calculate percentages and rates
    const catchPercent = deltaSeen > 0 ? ((deltaCaught / deltaSeen) * 100).toFixed(1) : '0.0';
    const caughtPerHour = (deltaCaught / hoursPlayed).toFixed(1);
    
    // Update the card with calculated values
    document.getElementById('trainerDisplay').textContent = trainerName;
    document.getElementById('pokemonDisplay').textContent = pokemonName.toUpperCase();
    document.getElementById('deltaCaught').textContent = deltaCaught;
    document.getElementById('catchPercent').textContent = catchPercent + '%';
    document.getElementById('caughtPerHour').textContent = caughtPerHour;
    document.getElementById('shinyTotal').textContent = shinyCount;
    
    // Display stats summary
    const statsDifference = document.getElementById('statsDifference');
    statsDifference.innerHTML = `<strong>Session Summary:</strong> You encountered ${deltaSeen} Pokémon and caught ${deltaCaught} of them. That's a ${catchPercent}% catch rate!`;
    statsDifference.style.display = 'block';
    
    // Show the card and download button
    document.getElementById('card').style.display = 'block';
    document.getElementById('downloadBtn').style.display = 'block';
    
    // Scroll to the results
    document.getElementById('card').scrollIntoView({ behavior: 'smooth' });
}

// Function to download the card as an image
function downloadCard() {
    const card = document.getElementById('card');
    
    // Show processing feedback
    const downloadBtn = document.getElementById('downloadBtn');
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Processing...';
    downloadBtn.disabled = true;
    
    html2canvas(card).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        link.download = 'my-comm-day-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Reset button
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    });
}
