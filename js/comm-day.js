/**
 * OCR.space Implementation for Pokémon GO Comm Day Calculator
 * Drop-in replacement for the existing OCR functionality
 */

// Initialize on document load
document.addEventListener('DOMContentLoaded', function() {
  setupImagePreviews();
  setupModalFunctionality();
  setupFormListeners();
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
 * Set up listeners for form fields
 */
function setupFormListeners() {
  // Auto-update differences when values change
  const fields = ['startSeen', 'endSeen', 'startCaught', 'endCaught'];
  fields.forEach(field => {
    const elem = document.getElementById(field);
    if (elem) {
      elem.addEventListener('input', updateDifferenceDisplay);
    }
  });
}

/**
 * Update the difference display based on current form values
 */
function updateDifferenceDisplay() {
  const startSeen = parseInt(document.getElementById('startSeen').value) || 0;
  const endSeen = parseInt(document.getElementById('endSeen').value) || 0;
  const startCaught = parseInt(document.getElementById('startCaught').value) || 0;
  const endCaught = parseInt(document.getElementById('endCaught').value) || 0;
  
  const diffDisplay = document.getElementById('statsDifference');
  if (!diffDisplay) return;
  
  // Only show if we have valid values
  if (endSeen >= startSeen && endCaught >= startCaught && 
      (endSeen > startSeen || endCaught > startCaught)) {
    
    const seenDiff = endSeen - startSeen;
    const caughtDiff = endCaught - startCaught;
    const catchRate = seenDiff > 0 ? (caughtDiff / seenDiff) * 100 : 0;
    
    diffDisplay.innerHTML = `
      <strong>Session Summary:</strong> You encountered ${seenDiff} Pokémon and caught ${caughtDiff} of them.
      That's a ${catchRate.toFixed(1)}% catch rate!
    `;
    diffDisplay.style.display = 'block';
  } else {
    diffDisplay.style.display = 'none';
  }
}

/**
 * Process image with OCR.space API
 * @param {File} imageFile - The image file to process
 * @returns {Promise<string>} - The extracted text
 */
function processWithOCRspace(imageFile) {
  // Create form data
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('apikey', 'helloworld'); // Free API key
  formData.append('language', 'eng');
  formData.append('scale', 'true'); // Helps with small text
  formData.append('OCREngine', '2'); // More accurate engine
  
  // For Pokémon GO screenshots, these settings help:
  formData.append('detectOrientation', 'true');
  formData.append('isTable', 'false');
  
  return fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status}`);
    }
    return response.json();
  })
  .then(result => {
    console.log('OCR Result:', result);
    
    if (result.OCRExitCode !== 1) {
      throw new Error(`OCR processing failed: ${result.ErrorMessage || 'Unknown error'}`);
    }
    
    if (result.ParsedResults && result.ParsedResults.length > 0) {
      return result.ParsedResults[0].ParsedText;
    }
    
    throw new Error('No text found in image');
  });
}

/**
 * Extract Pokémon GO stats from OCR text
 * @param {string} text - The OCR extracted text
 * @returns {Object} - Extracted stats
 */
function extractPokemonStats(text) {
  console.log('Extracting stats from:', text);
  
  const stats = {
    seen: null,
    caught: null,
    pokemon: null
  };
  
  // Clean up the text for better matching
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim();
  
  // Enhanced patterns for Pokémon GO stat screens
  
  // Seen count - checking multiple patterns
  const seenPatterns = [
    /SEEN\s*[:\s]*(\d+)/i,          // "SEEN: 123" or "SEEN 123"
    /seen[:\s]*(\d+)/i,              // "seen: 123" or "seen 123"
    /(\d+)\s*seen/i,                // "123 seen"
    /(\d+)[:\s]*Seen/i              // "123: Seen" or "123 Seen"
  ];
  
  // Try each pattern until we find a match
  for (const pattern of seenPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      stats.seen = match[1].trim();
      break;
    }
  }
  
  // Caught count - checking multiple patterns
  const caughtPatterns = [
    /CAUGHT\s*[:\s]*(\d+)/i,        // "CAUGHT: 123" or "CAUGHT 123"
    /caught[:\s]*(\d+)/i,            // "caught: 123" or "caught 123"
    /(\d+)\s*caught/i,              // "123 caught"
    /(\d+)[:\s]*Caught/i            // "123: Caught" or "123 Caught"
  ];
  
  // Try each pattern until we find a match
  for (const pattern of caughtPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      stats.caught = match[1].trim();
      break;
    }
  }
  
  // Try to extract Pokémon name
  const pokemonNamePattern = /\d+\s+([A-Z]{3,})/;
  const pokemonMatch = cleanText.match(pokemonNamePattern);
  if (pokemonMatch && pokemonMatch[1]) {
    stats.pokemon = pokemonMatch[1].trim();
  }
  
  // For your specific screenshot pattern - numbers at bottom of screen
  // Looking for simple numbers near the middle of the screen
  if (!stats.seen || !stats.caught) {
    // Find all numbers in text
    const numbers = cleanText.match(/\b\d+\b/g) || [];
    
    if (numbers.length >= 2) {
      // Filter to reasonable range (0-100000)
      const validNumbers = numbers
        .map(n => parseInt(n.trim(), 10))
        .filter(n => !isNaN(n) && n >= 0 && n < 100000);
      
      // Sort by size (typically seen > caught)
      validNumbers.sort((a, b) => b - a);
      
      // If found valid numbers and still missing stats
      if (validNumbers.length >= 2) {
        if (!stats.seen) {
          stats.seen = validNumbers[0].toString();
        }
        if (!stats.caught) {
          // For your screenshots, caught value is usually the second largest number
          stats.caught = validNumbers[1].toString();
        }
      }
    }
  }
  
  // Debug
  console.log('Extracted stats:', stats);
  
  return stats;
}

/**
 * Optimize image before sending to OCR
 * @param {File} imageFile - The image file to optimize
 * @returns {Promise<File>} - Optimized image file
 */
function optimizeImageForOCR(imageFile) {
  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = function(e) {
      img.onload = function() {
        try {
          // Create canvas for image processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Process image for better OCR
          for (let i = 0; i < data.length; i += 4) {
            // Check if pixel is light blue (Pokémon GO background)
            const isLightBlue = data[i] > 100 && data[i+1] > 180 && data[i+2] > 200;
            
            if (isLightBlue) {
              // Make background white
              data[i] = 255;     // R
              data[i+1] = 255;   // G
              data[i+2] = 255;   // B
            } else {
              // Boost contrast for text
              const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
              if (brightness < 120) {
                // Make dark text darker
                data[i] = Math.max(0, data[i] - 50);
                data[i+1] = Math.max(0, data[i+1] - 50);
                data[i+2] = Math.max(0, data[i+2] - 50);
              }
            }
          }
          
          // Put processed data back to canvas
          ctx.putImageData(imageData, 0, 0);
          
          // Convert canvas to file
          canvas.toBlob(blob => {
            resolve(new File([blob], 'optimized.jpg', { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.9);
        } catch (error) {
          console.error('Image optimization error:', error);
          resolve(imageFile); // Fall back to original file
        }
      };
      
      img.onerror = function() {
        console.error('Failed to load image');
        resolve(imageFile); // Fall back to original file
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      console.error('Failed to read file');
      resolve(imageFile); // Fall back to original file
    };
    
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Bank screenshots for future improvement (if user consents)
 * @param {File} startFile - Start screenshot
 * @param {File} endFile - End screenshot
 * @param {Object} metadata - Associated data
 */
function bankScreenshots(startFile, endFile, metadata) {
  // Only if user consented (consent checkbox should be added to HTML)
  const consent = document.getElementById('consentCheckbox')?.checked;
  if (!consent) return;
  
  // For Community Day collection, you can use:
  emailScreenshots(startFile, endFile, metadata);
}

/**
 * Email screenshots using a service like formspree.io
 * This is a simple solution that requires no backend
 */
function emailScreenshots(startFile, endFile, metadata) {
  // Create form data
  const formData = new FormData();
  
  // Add files
  formData.append('startImage', startFile);
  formData.append('endImage', endFile);
  
  // Add metadata as JSON
  formData.append('metadata', JSON.stringify(metadata, null, 2));
  
  // Add UI device info
  formData.append('screenWidth', window.innerWidth);
  formData.append('screenHeight', window.innerHeight);
  formData.append('userAgent', navigator.userAgent);
  
  // Set a reasonable subject line
  formData.append('_subject', 'PlayerZero CommDay Screenshot Bank');
  
  // Send with formspree.io - replace with your email
  // You'll need to sign up at formspree.io for a free account
  fetch('https://formspree.io/f/YOUR_FORM_ID', {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(response => console.log('Screenshots banked'))
  .catch(error => console.error('Error banking screenshots:', error));
}

/**
 * Run OCR on uploaded screenshots
 */
function runOCR() {
  const startFile = document.getElementById('startImage').files[0];
  const endFile = document.getElementById('endImage').files[0];
  const feedback = document.getElementById('ocrFeedback');
  
  if (!startFile || !endFile) {
    feedback.innerHTML = '⚠️ Please upload both start and end screenshots.';
    feedback.className = 'feedback error';
    return;
  }
  
  // Show processing status
  feedback.innerHTML = '<div class="loading-spinner"></div> Analyzing screenshots...';
  feedback.className = 'feedback processing';
  
  // Optimize images first
  Promise.all([
    optimizeImageForOCR(startFile),
    optimizeImageForOCR(endFile)
  ])
  .then(([optimizedStartFile, optimizedEndFile]) => {
    // Process start image
    return processWithOCRspace(optimizedStartFile)
      .then(startText => {
        // Extract stats from start image
        const startStats = extractPokemonStats(startText);
        console.log('Start stats:', startStats);
        
        // Update form with start values
        if (startStats.seen) document.getElementById('startSeen').value = startStats.seen;
        if (startStats.caught) document.getElementById('startCaught').value = startStats.caught;
        if (startStats.pokemon) document.getElementById('pokemonName').value = startStats.pokemon;
        
        // Now process end image
        return processWithOCRspace(optimizedEndFile)
          .then(endText => {
            // Extract stats from end image
            const endStats = extractPokemonStats(endText);
            console.log('End stats:', endStats);
            
            // Update form with end values
            if (endStats.seen) document.getElementById('endSeen').value = endStats.seen;
            if (endStats.caught) document.getElementById('endCaught').value = endStats.caught;
            if (!startStats.pokemon && endStats.pokemon) {
              document.getElementById('pokemonName').value = endStats.pokemon;
            }
            
            // Collect the metadata
            const metadata = {
              timestamp: new Date().toISOString(),
              startStats: startStats,
              endStats: endStats,
              screen: {
                width: window.innerWidth,
                height: window.innerHeight
              }
            };
            
            // Bank screenshots for future improvement
            bankScreenshots(startFile, endFile, metadata);
            
            // Update feedback
            const fieldsPopulated = 
              (startStats.seen ? 1 : 0) + 
              (startStats.caught ? 1 : 0) + 
              (endStats.seen ? 1 : 0) + 
              (endStats.caught ? 1 : 0);
            
            if (fieldsPopulated >= 3) {
              feedback.innerHTML = '✅ Stats extracted successfully! Please verify and adjust if needed.';
              feedback.className = 'feedback success';
              updateDifferenceDisplay();
            } else if (fieldsPopulated > 0) {
              feedback.innerHTML = '⚠️ Partial stats extracted. Please fill in the missing values.';
              feedback.className = 'feedback warning';
            } else {
              feedback.innerHTML = '❌ Could not extract stats. Please enter manually.';
              feedback.className = 'feedback error';
            }
          });
      });
  })
  .catch(error => {
    console.error('OCR error:', error);
    feedback.innerHTML = '❌ Error analyzing screenshots. Please try again or enter stats manually.';
    feedback.className = 'feedback error';
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
