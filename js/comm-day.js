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

// Get API key (obfuscated)
function getApiKey() {
    // Obfuscated key construction
    const p1 = "K84";
    const p2 = "614";
    const p3 = "746";
    const p4 = "888";
    const p5 = "957";
    return p1 + p2 + p3 + p4 + p5;
}

// Process images using the OCR API
async function runOCR() {
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
    
    // Upload to Supabase if consent is given
    if (document.getElementById('consentCheckbox').checked) {
        try {
            // Upload screenshots to Supabase first
            await uploadToSupabase(startImage.files[0], endImage.files[0]);
            console.log('Screenshots uploaded to Supabase successfully');
        } catch (error) {
            console.error('Error uploading to Supabase:', error);
            // Continue with OCR even if Supabase upload fails
        }
    }
    
    try {
        // Process start image
        const startResult = await processImageWithOCR(startImage.files[0]);
        console.log("Start OCR Result:", startResult);
        
        // Process end image
        const endResult = await processImageWithOCR(endImage.files[0]);
        console.log("End OCR Result:", endResult);
        
        // Extract Pokémon stats
        const pokemonName = extractPokemonName(startResult, endResult);
        const startStats = extractStats(startResult);
        const endStats = extractStats(endResult);
        
        console.log("Extracted Start Stats:", startStats);
        console.log("Extracted End Stats:", endStats);
        
        // Update form fields with the extracted values
        document.getElementById('pokemonName').value = pokemonName;
        document.getElementById('startSeen').value = startStats.seen;
        document.getElementById('endSeen').value = endStats.seen;
        document.getElementById('startCaught').value = startStats.caught;
        document.getElementById('endCaught').value = endStats.caught;
        
        // Check if the values make sense (end should be >= start)
        const deltaSeen = endStats.seen - startStats.seen;
        const deltaCaught = endStats.caught - startStats.caught;
        
        if (deltaSeen < 0 || deltaCaught < 0) {
            ocrFeedback.innerHTML = '⚠️ Warning: The extracted end values are lower than start values. ' +
                'This might indicate the screenshots were uploaded in reverse order or OCR errors. ' +
                'Please verify and adjust the values if needed.';
            ocrFeedback.className = 'feedback warning';
        } else {
            ocrFeedback.innerHTML = '✅ Stats extracted successfully! Please verify and adjust if needed.';
            ocrFeedback.className = 'feedback success';
            
            // Calculate catch rate
            const catchRate = deltaSeen > 0 ? ((deltaCaught / deltaSeen) * 100).toFixed(1) : "0.0";
            
            // Display stats summary
            statsDifference.innerHTML = `<strong>Session Summary:</strong> You encountered ${deltaSeen} Pokémon and caught ${deltaCaught} of them. That's a ${catchRate}% catch rate!`;
            statsDifference.style.display = 'block';
        }
    } catch (error) {
        console.error('OCR processing error:', error);
        ocrFeedback.innerHTML = '❌ Error processing screenshots. Please try entering your stats manually.';
        ocrFeedback.className = 'feedback error';
    }
}

// Upload files to Supabase
async function uploadToSupabase(startFile, endFile) {
    // Initialize Supabase client
    const supabaseUrl = 'https://smoqfhecjfslcqmebjrw.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtb3FmaGVjamZzbGNxbWVianJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NDYyOTMsImV4cCI6MjA2MDUyMjI5M30.-Onsb5CE-LbAOUe9dOtcczsjDFESxgbOUIws3f4jOFo';
    
    // Load Supabase client if it's available
    if (typeof supabase === 'undefined') {
        // If global supabase object isn't available, try to create it
        if (typeof window.supabase !== 'undefined') {
            // Using the global supabase from the loaded script
            var client = window.supabase.createClient(supabaseUrl, supabaseKey);
        } else {
            console.error('Supabase client not available. Please ensure the Supabase script is loaded.');
            return;
        }
    } else {
        // Use global supabase object
        var client = supabase.createClient(supabaseUrl, supabaseKey);
    }
    
    // Get trainer name for the filename
    const trainerName = document.getElementById('trainerName').value || 'Unknown';
    const timestamp = Date.now();
    
    try {
        // Upload start photo with improved error handling
        const { data: startData, error: startError } = await client.storage
            .from('pawmi-commday-screenshots')
            .upload(`${trainerName}_start_${timestamp}.jpg`, startFile, {
                contentType: 'image/jpeg',
                upsert: true
            });
        
        if (startError) {
            console.error('Error uploading start screenshot:', startError);
            throw startError;
        }
        
        // Upload end photo with improved error handling
        const { data: endData, error: endError } = await client.storage
            .from('pawmi-commday-screenshots')
            .upload(`${trainerName}_end_${timestamp}.jpg`, endFile, {
                contentType: 'image/jpeg',
                upsert: true
            });
        
        if (endError) {
            console.error('Error uploading end screenshot:', endError);
            throw endError;
        }
        
        console.log("Supabase upload successful - Start image:", startData);
        console.log("Supabase upload successful - End image:", endData);
        
        return { startData, endData };
    } catch (error) {
        console.error('Error in Supabase upload:', error);
        throw error;
    }
}

// Process image with OCR API (OCR.space API)
async function processImageWithOCR(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Get base64 image data
                const base64Image = e.target.result.split(',')[1];
                
                // Call OCR.space API
                const formData = new FormData();
                formData.append('apikey', getApiKey());
                formData.append('base64Image', base64Image);
                formData.append('language', 'eng');
                formData.append('scale', 'true');
                formData.append('OCREngine', '2');
                
                const response = await fetch('https://api.ocr.space/parse/image', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('OCR API request failed');
                }
                
                const result = await response.json();
                
                if (result.IsErroredOnProcessing) {
                    throw new Error(result.ErrorMessage || 'OCR processing failed');
                }
                
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function(error) {
            reject(error);
        };
        
        reader.readAsDataURL(imageFile);
    });
}

// Extract Pokémon name from OCR results
function extractPokemonName(startResult, endResult) {
    // For OCR.space API
    let pokemonName = "";
    
    // Try to find the Pokémon name in either result
    // Check end result first (might be clearer)
    if (endResult && endResult.ParsedResults && endResult.ParsedResults.length > 0) {
        const text = endResult.ParsedResults[0].ParsedText;
        
        // Look for Pokémon name pattern - typically all caps in the middle
        const nameRegex = /\b([A-Z]{4,})\b/g;
        const matches = text.match(nameRegex);
        
        if (matches && matches.length > 0) {
            // Find the most likely Pokémon name (filter out common UI text)
            const uiElements = ['SEEN', 'CAUGHT', 'BATTLE', 'INFO', 'SHINY', 'LUCKY'];
            for (const match of matches) {
                if (!uiElements.includes(match)) {
                    pokemonName = match;
                    break;
                }
            }
        }
    }
    
    // If not found in end result, try start result
    if (!pokemonName && startResult && startResult.ParsedResults && startResult.ParsedResults.length > 0) {
        const text = startResult.ParsedResults[0].ParsedText;
        
        const nameRegex = /\b([A-Z]{4,})\b/g;
        const matches = text.match(nameRegex);
        
        if (matches && matches.length > 0) {
            const uiElements = ['SEEN', 'CAUGHT', 'BATTLE', 'INFO', 'SHINY', 'LUCKY'];
            for (const match of matches) {
                if (!uiElements.includes(match)) {
                    pokemonName = match;
                    break;
                }
            }
        }
    }
    
    return pokemonName || "POKEMON";
}

// Extract stats from OCR result
function extractStats(ocrResult) {
    // Default values if extraction fails
    let seen = 0;
    let caught = 0;
    
    // For OCR.space API
    if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults.length > 0) {
        const text = ocrResult.ParsedResults[0].ParsedText;
        
        // First look for explicit "SEEN" and "CAUGHT" labels
        // Regex to handle variations in OCR text recognition
        const seenRegex = /SEEN\s*[:\s]\s*(\d+)/i;
        const caughtRegex = /CAUGHT\s*[:\s]\s*(\d+)/i;
        
        const seenMatch = text.match(seenRegex);
        const caughtMatch = text.match(caughtRegex);
        
        if (seenMatch) {
            seen = parseInt(seenMatch[1]);
        }
        
        if (caughtMatch) {
            caught = parseInt(caughtMatch[1]);
        }
        
        // If we couldn't find labeled stats, try to extract numbers near the SEEN/CAUGHT words
        if ((seen === 0 || caught === 0)) {
            // Try to find the stats box that typically shows SEEN and CAUGHT numbers
            // In Pokémon GO, these typically appear as two numbers in the middle of the screen
            const lines = text.split('\n');
            
            // Look for lines with "SEEN" or "CAUGHT" and try to extract nearby numbers
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.includes('SEEN') && !seenMatch) {
                    // Look for numbers in this line or adjacent lines
                    const numberMatch = line.match(/\d+/);
                    if (numberMatch) {
                        seen = parseInt(numberMatch[0]);
                    } else if (i + 1 < lines.length) {
                        // Check next line
                        const nextLineNumber = lines[i + 1].match(/\d+/);
                        if (nextLineNumber) {
                            seen = parseInt(nextLineNumber[0]);
                        }
                    }
                }
                
                if (line.includes('CAUGHT') && !caughtMatch) {
                    // Look for numbers in this line or adjacent lines
                    const numberMatch = line.match(/\d+/);
                    if (numberMatch) {
                        caught = parseInt(numberMatch[0]);
                    } else if (i + 1 < lines.length) {
                        // Check next line
                        const nextLineNumber = lines[i + 1].match(/\d+/);
                        if (nextLineNumber) {
                            caught = parseInt(nextLineNumber[0]);
                        }
                    }
                }
            }
            
            // Last resort: if we still don't have values, look for numbers in the stats section region
            if (seen === 0 || caught === 0) {
                const numbers = text.match(/\d+/g) || [];
                
                if (numbers.length >= 2) {
                    const parsedNumbers = numbers.map(num => parseInt(num)).filter(num => num > 0);
                    parsedNumbers.sort((a, b) => b - a); // Sort in descending order
                    
                    if (parsedNumbers.length >= 2) {
                        if (seen === 0) seen = parsedNumbers[0];
                        if (caught === 0) caught = parsedNumbers[1];
                    }
                }
            }
        }
    }
    
    return { seen, caught };
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
