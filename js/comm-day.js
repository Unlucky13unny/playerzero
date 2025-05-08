/**
 * Optimized OCR specifically for Pokémon GO stats screens
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
  
  // Show processing feedback
  feedback.innerHTML = '<div class="loading-spinner"></div> Analyzing screenshots...';
  feedback.className = 'feedback processing';
  
  // Instead of relying on complex OCR, use a simpler approach focusing on the stats area
  Promise.all([
    processStatsImage(startFile, 'start'),
    processStatsImage(endFile, 'end')
  ])
  .then(([startStats, endStats]) => {
    console.log('Extracted stats:', { startStats, endStats });
    
    // Populate form fields with detected values
    let fieldsPopulated = 0;
    
    if (startStats.seen) {
      document.getElementById('startSeen').value = startStats.seen;
      fieldsPopulated++;
    }
    
    if (startStats.caught) {
      document.getElementById('startCaught').value = startStats.caught;
      fieldsPopulated++;
    }
    
    if (endStats.seen) {
      document.getElementById('endSeen').value = endStats.seen;
      fieldsPopulated++;
    }
    
    if (endStats.caught) {
      document.getElementById('endCaught').value = endStats.caught;
      fieldsPopulated++;
    }
    
    // Extract Pokémon name if found
    if (startStats.pokemon || endStats.pokemon) {
      document.getElementById('pokemonName').value = startStats.pokemon || endStats.pokemon;
      fieldsPopulated++;
    }
    
    // Check for shinies
    if (startStats.shiny || endStats.shiny) {
      document.getElementById('shinyCount').value = startStats.shiny || endStats.shiny || 1;
      fieldsPopulated++;
    }
    
    // Update feedback based on results
    if (fieldsPopulated >= 4) {
      feedback.innerHTML = '✅ Stats extracted successfully! Review below.';
      feedback.className = 'feedback success';
      updateDifferenceDisplay();
    } else if (fieldsPopulated > 0) {
      feedback.innerHTML = '⚠️ Partially extracted. Please complete missing fields.';
      feedback.className = 'feedback warning';
    } else {
      feedback.innerHTML = '❗ Could not extract stats. Please enter manually or try cropping screenshots to show just the SEEN and CAUGHT area.';
      feedback.className = 'feedback error';
    }
  })
  .catch(error => {
    console.error('Error processing images:', error);
    feedback.innerHTML = '❗ Error processing images. Try cropping screenshots to just show the stats area.';
    feedback.className = 'feedback error';
  });
}

/**
 * Process image to extract Pokémon GO stats
 * Using a more simplified, focused approach for the specific stats region
 */
function processStatsImage(file, type) {
  return new Promise((resolve, reject) => {
    // Create an image from the file
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = function(e) {
      img.onload = function() {
        try {
          // Create canvas to analyze image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // For Pokémon GO, focus on bottom third where SEEN/CAUGHT usually appear
          const statsArea = {
            x: 0,
            y: Math.floor(img.height * 0.6),  // Bottom 40% of screen
            width: img.width,
            height: Math.floor(img.height * 0.4)
          };
          
          // Extract just the stats region
          const statsImageData = ctx.getImageData(
            statsArea.x, statsArea.y, statsArea.width, statsArea.height
          );
          
          // Draw the stats region to a new canvas
          const statsCanvas = document.createElement('canvas');
          statsCanvas.width = statsArea.width;
          statsCanvas.height = statsArea.height;
          const statsCtx = statsCanvas.getContext('2d');
          statsCtx.putImageData(statsImageData, 0, 0);
          
          // Enhance the image for OCR
          enhanceImageForOCR(statsCtx, statsCanvas.width, statsCanvas.height);
          
          // Run OCR on the enhanced image
          Tesseract.recognize(
            statsCanvas.toDataURL('image/png'),
            'eng',
            { 
              logger: m => console.log(`OCR Progress (${type}):`, m),
              tessedit_char_whitelist: '0123456789SENCATUGHDsencatughd: ',
            }
          )
          .then(result => {
            // Process the OCR result to extract stats
            const text = result.data.text;
            console.log(`OCR Text (${type}):`, text);
            
            // Extract stats using more specific patterns
            const stats = extractPokemonStats(text, result.data.words || []);
            
            // If the stats area didn't work, try the whole image
            if (!stats.seen && !stats.caught) {
              // Enhance whole image
              enhanceImageForOCR(ctx, canvas.width, canvas.height);
              
              // Try OCR on whole image
              return Tesseract.recognize(
                canvas.toDataURL('image/png'),
                'eng',
                { 
                  logger: m => console.log(`Full OCR Progress (${type}):`, m),
                  tessedit_char_whitelist: '0123456789SENCATUGHDsencatughd: ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
                }
              )
              .then(fullResult => {
                console.log(`Full OCR Text (${type}):`, fullResult.data.text);
                return extractPokemonStats(
                  fullResult.data.text, 
                  fullResult.data.words || [],
                  true  // Use broader extraction patterns for whole image
                );
              });
            }
            
            return stats;
          })
          .then(stats => {
            // Log and resolve the extracted stats
            console.log(`Extracted stats (${type}):`, stats);
            resolve(stats);
          })
          .catch(err => {
            console.error(`OCR error (${type}):`, err);
            reject(err);
          });
        } catch (error) {
          console.error('Image processing error:', error);
          reject(error);
        }
      };
      
      img.onerror = function() {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Enhance image for better OCR recognition
 */
function enhanceImageForOCR(ctx, width, height) {
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Enhance contrast and convert Pokémon GO blue background to white
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Check if pixel is light blue (Pokémon GO background)
    if (r > 100 && g > 180 && b > 200) {
      // Convert to white
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
    } else {
      // Check if pixel is dark (potential text)
      const brightness = (r + g + b) / 3;
      if (brightness < 100) {
        // Enhance contrast for text
        data[i] = 0;     // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
      }
    }
  }
  
  // Update the image with our changes
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Extract Pokémon stats from OCR text
 */
function extractPokemonStats(text, words, fullImage = false) {
  const stats = {
    seen: null,
    caught: null,
    pokemon: null,
    shiny: null
  };
  
  // Normalize text for better matching
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
  
  // Look for common patterns in Pokémon GO stat display
  
  // SEEN and CAUGHT often appear with numbers
  const seenPattern = fullImage ? 
    /seen[:\s]*(\d+)/i : 
    /seen[:\s]*(\d+)/i;
  
  const caughtPattern = fullImage ? 
    /caught[:\s]*(\d+)/i : 
    /caught[:\s]*(\d+)/i;
  
  // Extract SEEN count
  const seenMatch = normalizedText.match(seenPattern);
  if (seenMatch && seenMatch[1]) {
    stats.seen = seenMatch[1].trim();
  }
  
  // Extract CAUGHT count
  const caughtMatch = normalizedText.match(caughtPattern);
  if (caughtMatch && caughtMatch[1]) {
    stats.caught = caughtMatch[1].trim();
  }
  
  // If we couldn't find patterns, look for isolated numbers
  if ((!stats.seen || !stats.caught) && words.length > 0) {
    // Convert words to array of possible numbers
    const numbers = words
      .map(w => w.text.trim())
      .filter(w => /^\d+$/.test(w))
      .map(n => parseInt(n, 10))
      .filter(n => n > 0 && n < 100000);  // Filter out unreasonable values
    
    // Sort numbers in descending order
    numbers.sort((a, b) => b - a);
    
    // If we have at least two numbers, guess that larger is seen, smaller is caught
    if (numbers.length >= 2 && !stats.seen && !stats.caught) {
      stats.seen = numbers[0].toString();
      stats.caught = numbers[1].toString();
    }
    // If we have one stat and one number, guess the other
    else if (numbers.length >= 1) {
      if (stats.seen && !stats.caught) {
        // Find next largest number less than seen
        const seenValue = parseInt(stats.seen, 10);
        const caughtValue = numbers.find(n => n < seenValue);
        if (caughtValue) stats.caught = caughtValue.toString();
      } 
      else if (!stats.seen && stats.caught) {
        // Find next largest number greater than caught
        const caughtValue = parseInt(stats.caught, 10);
        const seenValue = numbers.find(n => n > caughtValue);
        if (seenValue) stats.seen = seenValue.toString();
      }
    }
  }
  
  // Try to extract Pokémon name
  if (fullImage) {
    // Pokémon names in GO are usually all caps after a number (trainer ID)
    const pokemonMatch = text.match(/\d+\s+([A-Z]{4,})/);
    if (pokemonMatch && pokemonMatch[1]) {
      stats.pokemon = pokemonMatch[1].trim();
    }
    
    // Check for SHINY indicators
    if (text.toLowerCase().includes('shiny')) {
      stats.shiny = '1';
    }
  }
  
  return stats;
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
