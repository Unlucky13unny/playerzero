/**
 * Community Day Calculator JavaScript
 */

// Set up file input previews
document.addEventListener('DOMContentLoaded', function() {
  setupImagePreviews();
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
      // Auto-populate form fields with the OCR results
      if (startData.seen) document.getElementById('startSeen').value = startData.seen;
      if (startData.caught) document.getElementById('startCaught').value = startData.caught;
      if (endData.seen) document.getElementById('endSeen').value = endData.seen;
      if (endData.caught) document.getElementById('endCaught').value = endData.caught;
      
      // Update feedback and enable button
      feedback.innerHTML = 'Stats imported successfully! Please verify accuracy below.';
      feedback.className = 'feedback success';
      importBtn.disabled = false;
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
    
    // Extract the numbers we need
    const seenMatch = text.match(/Seen\s*:?\s*(\d+)/i) || 
                      text.match(/(\d+)\s*seen/i);
    
    const caughtMatch = text.match(/Caught\s*:?\s*(\d+)/i) || 
                        text.match(/(\d+)\s*caught/i);
    
    // Pokemon name extraction (may not be reliable with OCR)
    const pokemonName = extractPokemonName(text);
    
    if (type === 'start' && pokemonName) {
      document.getElementById('pokemonName').value = pokemonName;
    }
    
    // Return extracted data
    return {
      seen: seenMatch ? seenMatch[1].replace(/,/g, '') : null,
      caught: caughtMatch ? caughtMatch[1].replace(/,/g, '') : null,
      pokemonName: pokemonName
    };
  });
}

/**
 * Try to extract Pokemon name from OCR text
 * Note: This is challenging and may need to be manually entered
 * @param {string} text - The OCR extracted text
 * @return {string|null} Extracted Pokemon name or null
 */
function extractPokemonName(text) {
  // This is a simplified attempt - may need manual entry
  const pokedexMatch = text.match(/Pok[eé]dex\s*entry[:\s]*#\d+\s*([A-Za-z]+)/i);
  if (pokedexMatch) return pokedexMatch[1];
  
  return null;
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
