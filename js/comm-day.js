/**
 * Enhanced OCR for Pokémon GO Screenshots
 * This implementation adds preprocessing to improve Tesseract's performance
 */

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
  feedback.innerHTML = '<div class="loading-spinner"></div> Analyzing screenshots... This may take a moment.';
  feedback.className = 'feedback processing';
  
  // First preprocess the images to enhance text visibility
  Promise.all([
    preprocessImage(startFile),
    preprocessImage(endFile)
  ])
  .then(([startCanvas, endCanvas]) => {
    // After preprocessing, run OCR on the enhanced images
    return Promise.all([
      recognizeText(startCanvas, 'start'),
      recognizeText(endCanvas, 'end')
    ]);
  })
  .then(([startData, endData]) => {
    console.log("OCR Results:", { startData, endData });
    
    // Auto-populate form fields with the OCR results
    let fieldsPopulated = 0;
    
    if (startData.pokemonName) {
      document.getElementById('pokemonName').value = startData.pokemonName;
      fieldsPopulated++;
    }
    
    if (startData.seen) {
      document.getElementById('startSeen').value = startData.seen;
      fieldsPopulated++;
    }
    
    if (startData.caught) {
      document.getElementById('startCaught').value = startData.caught;
      fieldsPopulated++;
    }
    
    if (endData.seen) {
      document.getElementById('endSeen').value = endData.seen;
      fieldsPopulated++;
    }
    
    if (endData.caught) {
      document.getElementById('endCaught').value = endData.caught;
      fieldsPopulated++;
    }
    
    if (endData.shiny) {
      document.getElementById('shinyCount').value = endData.shiny;
      fieldsPopulated++;
    }
    
    // Update feedback based on how many fields were populated
    if (fieldsPopulated >= 4) {
      feedback.innerHTML = '✅ Stats extracted successfully! Please review and adjust if needed.';
      feedback.className = 'feedback success';
      
      // Show the difference calculation
      updateDifferences();
    } else if (fieldsPopulated > 0) {
      feedback.innerHTML = '⚠️ Some stats were extracted. Please complete the missing fields.';
      feedback.className = 'feedback warning';
    } else {
      feedback.innerHTML = '⚠️ Could not extract stats. Try adjusting the screenshots or enter values manually.';
      feedback.className = 'feedback error';
    }
    
    importBtn.disabled = false;
  })
  .catch(error => {
    console.error('OCR error:', error);
    feedback.innerHTML = '⚠️ Error processing images. Try cropping screenshots to just show the stats area.';
    feedback.className = 'feedback error';
    importBtn.disabled = false;
  });
}

/**
 * Preprocess image to improve OCR accuracy
 * @param {File} file - The image file to process
 * @returns {Promise<HTMLCanvasElement>} Canvas with processed image
 */
function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = function(e) {
      img.onload = function() {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image to the canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data to manipulate
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply image processing to enhance text visibility
        // This works especially well for the light blue background of Pokémon GO
        for (let i = 0; i < data.length; i += 4) {
          // Check if pixel is light blue (Pokémon GO background)
          const isLightBlue = data[i] > 100 && data[i+1] > 190 && data[i+2] > 220;
          
          if (isLightBlue) {
            // Make background white for better contrast
            data[i] = 255;     // R
            data[i+1] = 255;   // G
            data[i+2] = 255;   // B
          } else {
            // Enhance contrast for non-background elements
            // Boost black text
            if (data[i] < 100 && data[i+1] < 100 && data[i+2] < 100) {
              data[i] = 0;      // R
              data[i+1] = 0;    // G
              data[i+2] = 0;    // B
            }
          }
        }
        
        // Put the modified data back
        ctx.putImageData(imageData, 0, 0);
        
        // Resolve the canvas for OCR
        resolve(canvas);
      };
      
      img.onerror = function() {
        reject(new Error("Failed to load image"));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Perform text recognition on preprocessed image
 * @param {HTMLCanvasElement} canvas - Preprocessed image canvas
 * @param {string} type - Either 'start' or 'end'
 * @returns {Promise<Object>} Extracted data
 */
function recognizeText(canvas, type) {
  return new Promise((resolve, reject) => {
    // Convert canvas to a format Tesseract can use
    const dataUrl = canvas.toDataURL('image/png');
    
    // Configure Tesseract for better accuracy with number recognition
    const tessConfig = {
      lang: 'eng',
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:/ ',
      tessedit_pageseg_mode: '6', // Assume a single uniform text block
    };
    
    // Run Tesseract OCR
    Tesseract.recognize(dataUrl, tessConfig)
      .then(({ data }) => {
        // Get text and words from result
        const text = data.text;
        const words = data.words.map(w => w.text);
        
        console.log(`OCR ${type} result:`, text);
        console.log(`OCR ${type} words:`, words);
        
        // Extract specific information from Pokémon GO format
        const result = extractPokemonGoStats(text, words);
        resolve(result);
      })
      .catch(err => {
        console.error("Tesseract error:", err);
        reject(err);
      });
  });
}

/**
 * Extract Pokémon GO stats from OCR text
 * @param {string} text - Full OCR text
 * @param {Array<string>} words - Individual words from OCR
 * @returns {Object} Extracted stats
 */
function extractPokemonGoStats(text, words) {
  const result = {
    seen: null,
    caught: null,
    pokemonName: null,
    shiny: null
  };
  
  // Find Pokemon name (usually all caps after a number)
  const pokemonNameMatch = text.match(/\d+\s+([A-Z]{3,})/);
  if (pokemonNameMatch) {
    result.pokemonName = pokemonNameMatch[1].trim();
  }
  
  // Look for "SEEN" and the number next to it
  const seenMatch = text.match(/SEEN\s*[\n\r:]*\s*(\d+)/i);
  if (seenMatch) {
    result.seen = seenMatch[1].trim();
  } else {
    // Try finding the word "SEEN" and then look for nearby numbers
    const seenIndex = words.findIndex(w => w.match(/SEEN/i));
    if (seenIndex >= 0 && seenIndex < words.length - 1) {
      // Check the next few words for a number
      for (let i = 1; i <= 3; i++) {
        if (seenIndex + i < words.length && words[seenIndex + i].match(/^\d+$/)) {
          result.seen = words[seenIndex + i];
          break;
        }
      }
    }
  }
  
  // Look for "CAUGHT" and the number next to it
  const caughtMatch = text.match(/CAUGHT\s*[\n\r:]*\s*(\d+)/i);
  if (caughtMatch) {
    result.caught = caughtMatch[1].trim();
  } else {
    // Try finding the word "CAUGHT" and then look for nearby numbers
    const caughtIndex = words.findIndex(w => w.match(/CAUGHT/i));
    if (caughtIndex >= 0 && caughtIndex < words.length - 1) {
      // Check the next few words for a number
      for (let i = 1; i <= 3; i++) {
        if (caughtIndex + i < words.length && words[caughtIndex + i].match(/^\d+$/)) {
          result.caught = words[caughtIndex + i];
          break;
        }
      }
    }
  }
  
  // Look for "SHINY" indicator
  if (text.includes("SHINY")) {
    result.shiny = "1"; // Default to 1 if we find SHINY but no count
    
    // Try to find a number near SHINY
    const shinyMatch = text.match(/SHINY\s*(\d+)/i);
    if (shinyMatch) {
      result.shiny = shinyMatch[1].trim();
    }
  }
  
  // Fallback: Look for pairs of numbers which might be seen/caught
  if (!result.seen || !result.caught) {
    const numbers = text.match(/\b\d+\b/g) || [];
    if (numbers.length >= 2) {
      // Find two consecutive numbers that might be seen/caught
      for (let i = 0; i < numbers.length - 1; i++) {
        const num1 = parseInt(numbers[i]);
        const num2 = parseInt(numbers[i + 1]);
        
        // Usually seen > caught
        if (num1 > num2) {
          result.seen = result.seen || numbers[i];
          result.caught = result.caught || numbers[i + 1];
          break;
        }
      }
    }
  }
  
  return result;
}

/**
 * Update differences display as user types
 */
function updateDifferences() {
  const startSeen = parseInt(document.getElementById('startSeen').value) || 0;
  const endSeen = parseInt(document.getElementById('endSeen').value) || 0;
  const startCaught = parseInt(document.getElementById('startCaught').value) || 0;
  const endCaught = parseInt(document.getElementById('endCaught').value) || 0;
  
  // If we have valid before/after values, show the difference
  if (endSeen >= startSeen && endCaught >= startCaught) {
    const seenDiff = endSeen - startSeen;
    const caughtDiff = endCaught - startCaught;
    const catchRate = seenDiff > 0 ? (caughtDiff / seenDiff) * 100 : 0;
    
    const diffDisplay = document.getElementById('statsDifference');
    if (diffDisplay) {
      diffDisplay.innerHTML = `
        <strong>Session Summary:</strong> You encountered ${seenDiff} Pokémon and caught ${caughtDiff} of them.
        That's a ${catchRate.toFixed(1)}% catch rate!
      `;
      diffDisplay.style.display = 'block';
    }
  }
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
  if (endSeen < startSeen) {
    alert('End "Seen" value must be greater than or equal to start "Seen" value.');
    return;
  }
  
  if (endCaught < startCaught) {
    alert('End "Caught" value must be greater than or equal to start "Caught" value.');
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
  
  // Scroll to the card
  document.getElementById('card').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
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

// Initialize on document load
document.addEventListener('DOMContentLoaded', function() {
  setupImagePreviews();
  setupModalFunctionality();
  setupFieldListeners();
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
 * Set up the prize info modal functionality
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
 * Set up listeners for form fields to update differences
 */
function setupFieldListeners() {
  const fields = ['startSeen', 'endSeen', 'startCaught', 'endCaught'];
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', updateDifferences);
    }
  });
}
