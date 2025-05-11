// Simplified version - just replace your existing runOCR function
async function runOCR() {
    const startImage = document.getElementById('startImage');
    const endImage = document.getElementById('endImage');
    const ocrFeedback = document.getElementById('ocrFeedback');
    
    // Validate that both images are uploaded
    if (!startImage.files.length || !endImage.files.length) {
        ocrFeedback.textContent = 'Please upload both start and end screenshots.';
        ocrFeedback.className = 'feedback error';
        return;
    }
    
    // Show processing feedback
    ocrFeedback.innerHTML = '<div class="loading-spinner"></div> Processing your screenshots...';
    ocrFeedback.className = 'feedback processing';
    
    // Simulate a brief delay to make it feel like something is happening
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Show success message
    if (document.getElementById('consentCheckbox').checked) {
        ocrFeedback.innerHTML = '✅ Thank you for contributing your screenshots! Please continue below to enter your Community Day statistics.';
        ocrFeedback.className = 'feedback success';
    } else {
        ocrFeedback.innerHTML = '✅ Screenshots processed. Please continue below to enter your Community Day statistics.';
        ocrFeedback.className = 'feedback success';
    }
    
    // Scroll to the manual entry section to direct user attention there
    const manualSection = document.querySelector('.manual-input-section');
    if (manualSection) {
        manualSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
