/**
 * Community Day Calculator JavaScript
 */

// Set up file input previews
document.addEventListener('DOMContentLoaded', function() {
  setupImagePreviews();
  setupModalFunctionality();
});

/**
 * Set up image preview when files are selected
 */
function setupImagePreviews() {
  const startImage = document.getElementById('startImage');
  const endImage = document.getElementById('endImage');
  
  if (startImage) {
    startImage.addEventListener('change', function() {
      previewImage(this, 'startPreview');
    });
  }
  
  if (endImage) {
    endImage.addEventListener('change', function() {
      previewImage(this, 'endPreview');
    });
  }
}

/**
 * Set up the modal functionality
 */
function setupModalFunctionality() {
  const prizeBtn = document.getElementById('prizeInfoBtn');
  const prizeModal = document.getElementById('prizeInfoModal');
  const closeModal = document.getElementById('closeModal');
  
  if (prizeBtn && prizeModal && closeModal) {
    prizeBtn.addEventListener('click', () => {
      prizeModal.style.display = 'flex';
    });
    
    closeModal.addEventListener('click', () => {
      prizeModal.style.display = 'none';
    });
    
    prizeModal.addEventListener('click', (e) => {
      if (e.target === prizeModal) {
        prizeModal.style.display = 'none';
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && prizeModal.style.display === 'flex') {
        prizeModal.style.display = 'none';
      }
    });
  }
}

/**
 * Preview an image in the specified element
 * @param {HTMLInputElement} input - The file input element
 * @param {string} previewId - ID of the preview image element
 */
function previewImage(input, previewId) {
  const preview = document.getElementById(previewId);
  
  if (input.files && input.files[0] && preview) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    
    reader.readAsDataURL(input.files[0]);
  }
}

/**
 * Run OCR on both start and end screenshots
 */
function runOCR() {
  const startFile = document.getElementById('startImage').files[0];
  const endFile = document.getElementById('endImage').files[0];
  const feedback = document.getElementById('ocrFeedback');
  const importBtn = document.getElementById('importButton');
  
  if (!startFile || !endFile) {
    feedback.innerHTML = '⚠️ Please upload both start and end screenshots.';
    feedback.className = 'feedback error';
    return;
  }
  
  // Disable button and show processing status
  importBtn.disabled = true;
  feedback.innerHTML = 'Processing screenshots... This may take a moment.';
  feedback.className = 'feedback';
  
  // Process start image
  processImage(startFile, 'start')
    .then(startData => {
      // Once start image is done, process end image
      return processImage(endFile, 'end').then(endData => {
        return { startData, endData };
      });
    })
    .then(({ startData, endData }) => {
      // Extract Pokémon name if available
      if (startData.pokemonName) {
        document.getElementById('pokemonName').value = startData.pokemonName;
      }
      
      // Auto-populate form fields with the OCR results
      if (startData.seen) document.getElementById('startSeen').value = startData.seen;
      if (startData.caught) document.getElementById('startCaught').value = startData.caught;
      if (endData.seen) document.getElementById('endSeen').value = endData.seen;
      if (endData.caught) document.getElementById('endCaught').value = endData.caught;
      
      // Check for shinies in the data
      if (endData.shiny) document.getElementById('shinyCount').value = endData.shiny;
      
      // Update feedback and enable button
      feedback.innerHTML = 'Stats imported! Please verify and complete any missing fields.';
      feedback.className = 'feedback success';
      importBtn.disabled = false;
      
      // Auto-set trainer name if not set
      if (document.getElementById('trainerName').value === '') {
        document.getElementById('trainerName').value = 'Trainer';
      }
    })
    .catch(error => {
      console.error('OCR error:', error);
      feedback.innerHTML = '⚠️ Error processing images. Please check your screenshots or enter stats manually.';
      feedback.className = 'feedback error';
      importBtn.disabled = false;
    });
}

/**
 * Process a single image with OCR
 * @param {File} file - The image file to process
 * @param {string} type - Either 'start' or 'end' to indicate screenshot type
 * @return {Promise<Object>} OCR results
 */
function processImage(file, type) {
  return Tesseract.recognize(file, 'eng', { 
    logger: m => console.log(`OCR (${type}):`, m)
  })
  .then(({ data: { text } }) => {
    console.log(`Full OCR text (${type}):`, text);
    
    // Extract information from the OCR text
    // For Pokémon GO, we are specifically looking for SEEN and CAUGHT numbers
    
    // First, try to find direct patterns for these values
    const seenMatch = text.match(/SEEN\s*\n*\s*(\d+)/i) || 
                      text.match(/Seen\s*\n*\s*:?\s*(\d+)/i) ||
                      text.match(/(\d+)\s*Seen/i);
    
    const caughtMatch = text.match(/CAUGHT\s*\n*\s*(\d+)/i) || 
                        text.match(/Caught\s*\n*\s*:?\s*(\d+)/i) ||
                        text.match(/(\d+)\s*Caught/i);
    
    // Look for any lines with numbers, as a fallback
    const allNumbers = text.match(/\b\d+\b/g) || [];
    
    // Try to extract Pokémon name - it's usually in all caps near the top
    // Pokémon GO shows it as something like ©0919 NYMBLE
    const pokemonNameMatch = text.match(/\d+\s*([A-Z]{3,})/i);
    
    // Check for shiny indicators
    const shinyMatch = text.match(/SHINY\s*(\d+)/i) || text.match(/(\d+)\s*SHIN(Y|IES)/i);
    
    // Prepare the result object
    const result = {
      seen: null,
      caught: null,
      pokemonName: null,
      shiny: null
    };
    
    // Set values if found
    if (seenMatch) {
      result.seen = seenMatch[1].trim().replace(/[^0-9]/g, '');
    } else if (allNumbers.length >= 2) {
      // If we couldn't find explicit matches but have numbers,
      // assume the larger might be seen and smaller caught
      const numbers = allNumbers.map(n => parseInt(n));
      numbers.sort((a, b) => b - a); // Sort in descending order
      result.seen = numbers[0].toString();
    }
    
    if (caughtMatch) {
      result.caught = caughtMatch[1].trim().replace(/[^0-9]/g, '');
    } else if (allNumbers.length >= 2) {
      // If we couldn't find explicit matches but have numbers
      const numbers = allNumbers.map(n => parseInt(n));
      numbers.sort((a, b) => b - a); // Sort in descending order
      result.caught = numbers[1].toString();
    }
    
    if (pokemonNameMatch) {
      result.pokemonName = pokemonNameMatch[1].trim();
    }
    
    if (shinyMatch) {
      result.shiny = shinyMatch[1].trim().replace(/[^0-9]/g, '');
    }
    
    return result;
  });
}

/**
 * Calculate and display statistics
 */
function runStats() {
  // Get all input values
  const trainer = document.getElementById('trainerName').value || 'Trainer';
  const pokemon = document.getElementById('pokemonName').value || 'Pokémon';
  const startSeen = parseInt(document.getElementById('startSeen').value) || 0;
  const endSeen = parseInt(document.getElementById('endSeen').value) || 0;
  const startCaught = parseInt(document.getElementById('startCaught').value) || 0;
  const endCaught = parseInt(document.getElementById('endCaught').value) || 0;
  const shinyCount = parseInt(document.getElementById('shinyCount').value) || 0;
  const hoursPlayed = parseFloat(document.getElementById('hoursPlayed').value) || 1;
  
  // Validate inputs
  if (endSeen < startSeen || endCaught < startCaught) {
    alert('End values must be greater than or equal to start values.');
    return;
  }
  
  if (pokemon.trim() === '') {
    alert('Please enter the Pokémon name.');
    return;
  }
  
  if (hoursPlayed <= 0) {
    alert('Hours played must be greater than zero.');
    return;
  }
  
  // Calculate stats
  const seenDelta = endSeen - startSeen;
  const caughtDelta = endCaught - startCaught;
  const catchRate = seenDelta > 0 ? (caughtDelta / seenDelta) * 100 : 0;
  const caughtPerHour = caughtDelta / hoursPlayed;
  
  // Update card
  document.getElementById('trainerDisplay').textContent = trainer;
  document.getElementById('pokemonDisplay').textContent = pokemon;
  document.getElementById('deltaCaught').textContent = caughtDelta.toLocaleString();
  document.getElementById('catchPercent').textContent = catchRate.toFixed(1) + '%';
  document.getElementById('caughtPerHour').textContent = caughtPerHour.toFixed(1);
  document.getElementById('shinyTotal').textContent = shinyCount.toLocaleString();
  
  // Show card and download button
  document.getElementById('card').style.display = 'block';
  document.getElementById('downloadBtn').style.display = 'inline-block';
}

/**
 * Download the stats card as an image
 */
function downloadCard() {
  const card = document.getElementById('card');
  
  if (!card) {
    alert('Error: Could not find stats card to download.');
    return;
  }
  
  // Use html2canvas to generate image
  html2canvas(card, {
    backgroundColor: null,
    scale: 2, // Higher quality
    logging: false
  }).then(canvas => {
    // Create download link
    const link = document.createElement('a');
    link.download = 'comm_day_card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(error => {
    console.error('Error generating image:', error);
    alert('Error generating image. Please try again.');
  });
}
