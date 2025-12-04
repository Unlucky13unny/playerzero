import Tesseract from 'tesseract.js';

export interface ExtractedStats {
  distance_walked?: number;
  pokemon_caught?: number;
  pokestops_visited?: number;
  total_xp?: number;
  trainer_level?: number;
  unique_pokedex_entries?: number;
  username?: string;
  start_date?: string;
}

export interface OCRResult {
  stats: ExtractedStats;
  confidence: number;
  rawText: string;
}

// OCR.space API configuration (free tier: 25,000 requests/month)
const OCR_SPACE_API_KEY = 'K87899142388957'; // Free public API key
const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';

/**
 * Extract stats from a Pokémon GO profile screenshot using OCR
 * Uses OCR.space API for better accuracy than Tesseract
 */
export const extractStatsFromImage = async (
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  try {
    console.log('🚀 Using OCR.space API for better accuracy...');
    
    if (onProgress) onProgress(10);

    // Convert file to base64
    const base64Image = await fileToBase64(imageFile);
    
    if (onProgress) onProgress(20);

    // Prepare form data for OCR.space API
    const formData = new FormData();
    formData.append('base64Image', base64Image);
    formData.append('apikey', OCR_SPACE_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is more accurate

    if (onProgress) onProgress(30);

    console.log('📡 Sending image to OCR.space API...');

    // Call OCR.space API
    const response = await fetch(OCR_SPACE_URL, {
      method: 'POST',
      body: formData,
    });

    if (onProgress) onProgress(60);

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (onProgress) onProgress(80);

    console.log('📥 OCR.space API response:', result);

    if (!result.ParsedResults || result.ParsedResults.length === 0) {
      throw new Error('No text detected in image');
    }

    const text = result.ParsedResults[0].ParsedText;
    const confidence = result.ParsedResults[0].TextOrientation === "0" ? 95 : 85; // OCR.space doesn't provide confidence

    console.log('📋 Extracted text from OCR.space:', text);

    if (onProgress) onProgress(90);

    // Extract stats using pattern matching
    const stats = extractStatsFromText(text);

    if (onProgress) onProgress(100);

    return {
      stats,
      confidence,
      rawText: text,
    };
  } catch (error: any) {
    console.error('❌ OCR.space API failed, falling back to Tesseract.js...', error);
    
    // Fallback to Tesseract.js if OCR.space fails
    try {
      if (onProgress) onProgress(50);
      
      const result = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
              onProgress(50 + (m.progress * 50));
            }
          },
        }
      );

      const text = result.data.text;
      const confidence = result.data.confidence;

      // Extract stats using pattern matching
      const stats = extractStatsFromText(text);

      return {
        stats,
        confidence,
        rawText: text,
      };
    } catch (tesseractError) {
      console.error('❌ Tesseract.js also failed:', tesseractError);
      throw new Error('Failed to extract stats from image');
    }
  }
};

/**
 * Convert File to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(`data:${file.type};base64,${base64}`);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extract stats from OCR text using pattern matching
 */
const extractStatsFromText = (text: string): ExtractedStats => {
  const stats: ExtractedStats = {};

  // Clean the text - remove extra spaces and normalize
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  console.log('📋 Raw OCR Text:', text);
  console.log('📋 Cleaned OCR Text:', cleanText);

  // Extract Username (appears at the top, often with &)
  const usernamePatterns = [
    /^([A-Za-z0-9_]+)\s*&/m,
    /([A-Za-z0-9_]+)\s*&\s*[A-Za-z]/i,
  ];
  
  for (const pattern of usernamePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      stats.username = match[1];
      console.log(`✓ Found Username: ${stats.username}`);
      break;
    }
  }

  // Extract Start Date (format: 7/10/2016 or similar)
  const datePattern = /Start\s+Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i;
  const dateMatch = cleanText.match(datePattern);
  if (dateMatch) {
    stats.start_date = dateMatch[1];
    console.log(`✓ Found Start Date: ${stats.start_date}`);
  }

  // Pattern 1: Distance Walked - MUST have "km" to be valid!
  // This is the ONLY stat with "km", so it's the most reliable identifier
  const distancePatterns = [
    /Distance\s+Walked[:\s]*([\d,]+\.?\d*)\s*km/i,
    /Distance[:\s]+([\d,]+\.?\d*)\s*km/i,
    /Walked[:\s]+([\d,]+\.?\d*)\s*km/i,
    /([\d,]+\.\d+)\s*km/i, // Any decimal with km (e.g., 15,223.8 km)
  ];
  
  for (const pattern of distancePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const captured = match[1];
      console.log(`🔍 Distance Walked - Captured text: "${captured}"`);
      const value = parseFloat(captured.replace(/,/g, ''));
      console.log(`🔍 Distance Walked - Parsed value: ${value}`);
      // Distance must be a decimal number (has decimal point) and reasonable range
      if (!isNaN(value) && value > 0 && value < 100000) {
        stats.distance_walked = value;
        console.log(`✅ Distance Walked: ${value} km (from: "${match[0]}")`);
        break;
      }
    }
  }

  // Pattern 2: Pokémon Caught - MUST have "Pokémon Caught" or "Pokemon Caught" label
  // Added more variations to handle OCR misreads
  const pokemonPatterns = [
    /Pok[eé]mon\s+Caught[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i,
    /Pokemon\s+Caught[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i,
    /Pok[eé]mon\s+Caught\s+([\d,]+)/i,
    /Pokemon\s+Caught\s+([\d,]+)/i,
    /Caught[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i, // Just "Caught" followed by number
    /mon\s+Caught[:\s]*([\d,]+)/i, // Partial match for OCR issues
  ];
  
  for (const pattern of pokemonPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const captured = match[1];
      console.log(`🔍 Pokémon Caught - Captured text: "${captured}"`);
      const value = parseInt(captured.replace(/,/g, ''));
      console.log(`🔍 Pokémon Caught - Parsed value: ${value}`);
      // Must be a reasonable number (not too small, not confused with dates)
      if (!isNaN(value) && value > 100 && value < 10000000) {
        stats.pokemon_caught = value;
        console.log(`✅ Pokémon Caught: ${value.toLocaleString()} (from: "${match[0]}")`);
        break;
      }
    }
  }

  // Pattern 3: PokéStops Visited - MUST have "PokéStops Visited" or "PokeStops Visited" label
  // Added more variations to handle OCR misreads (including lowercase variations)
  const pokestopsPatterns = [
    /Pok[eé]Stops?\s+Visited[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i,
    /PokeStops\s+Visited[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i,
    /Pokestops\s+Visited[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i, // lowercase 's'
    /Stops\s+Visited[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i,
    /Visited[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i, // Just "Visited" followed by number
    /stops\s+Visited[:\s]*([\d,]+)/i, // lowercase starts
  ];
  
  for (const pattern of pokestopsPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const captured = match[1];
      console.log(`🔍 PokéStops Visited - Captured text: "${captured}"`);
      const value = parseInt(captured.replace(/,/g, ''));
      console.log(`🔍 PokéStops Visited - Parsed value: ${value}`);
      if (!isNaN(value) && value > 100 && value < 10000000) {
        stats.pokestops_visited = value;
        console.log(`✅ PokéStops Visited: ${value.toLocaleString()} (from: "${match[0]}")`);
        break;
      }
    }
  }

  // Pattern 4: Total XP - MUST have "Total XP" or "XP" label and be a LARGE number
  const xpPatterns = [
    /Total\s+XP[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i,
    /(?:^|\s)XP[:\s]*([\d,]+)(?!\s*km)(?!\s*\/)/i,
  ];
  
  for (const pattern of xpPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const captured = match[1];
      console.log(`🔍 Total XP - Captured text: "${captured}"`);
      const value = parseInt(captured.replace(/,/g, ''));
      console.log(`🔍 Total XP - Parsed value: ${value}`);
      // Total XP is usually VERY large (millions), not dates or small numbers
      if (!isNaN(value) && value > 100000) {
        stats.total_xp = value;
        console.log(`✅ Total XP: ${value.toLocaleString()} (from: "${match[0]}")`);
        break;
      }
    }
  }

  // Pattern 5: Trainer Level - DISABLED
  // We intentionally do NOT extract trainer_level from OCR
  // Trainer level should only be updated manually by the user in their profile settings
  // This prevents accidental level resets during stat updates
  // const levelPatterns = [
  //   /(\d{1,2})\s+LEVEL/i,
  //   /LEVEL\s+(\d{1,2})/i,
  // ];
  // 
  // for (const pattern of levelPatterns) {
  //   const match = cleanText.match(pattern);
  //   if (match) {
  //     const value = parseInt(match[1]);
  //     if (!isNaN(value) && value >= 1 && value <= 80) {
  //       stats.trainer_level = value;
  //       console.log(`✅ Trainer Level: ${value} (from: "${match[0]}")`);
  //       break;
  //     }
  //   }
  // }

  // Pattern 6: Pokédex Entries (only if explicitly shown in screenshot)
  const pokedexPatterns = [
    /Pok[eé]dex\s+Entries[:\s]+([\d,]+)/i,
    /Pok[eé]dex[:\s]+([\d,]+)/i,
    /unique\s+pok[eé]dex[:\s]+([\d,]+)/i,
  ];
  
  for (const pattern of pokedexPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (!isNaN(value) && value > 0 && value <= 2000) {
        stats.unique_pokedex_entries = value;
        console.log(`✓ Found Pokédex Entries: ${value} via pattern`);
        break;
      }
    }
  }

  // FALLBACK APPROACH - Only use if label-based matching failed
  // This is much more conservative to avoid wrong mappings
  console.log('\n🔍 Attempting fallback extraction for missing stats...');
  
  const numbers = cleanText.match(/[\d,]+\.?\d*/g);
  if (numbers) {
    const parsedNumbers = numbers.map(n => {
      const cleaned = n.replace(/,/g, '');
      const num = cleaned.includes('.') ? parseFloat(cleaned) : parseInt(cleaned);
      const position = cleanText.indexOf(n);
      return { original: n, value: num, isDecimal: cleaned.includes('.'), position };
    }).filter(n => !isNaN(n.value) && n.value > 0);

    console.log('📊 All numbers found:', parsedNumbers.map(n => `${n.original} (${n.value})`).join(', '));

    // CRITICAL RULE 1: Distance MUST be a decimal number near "km"
    if (!stats.distance_walked) {
      for (const num of parsedNumbers) {
        if (num.isDecimal && num.value > 1000 && num.value < 100000) {
          // Check if "km" appears within 10 characters after this number
          const textAfter = cleanText.substring(num.position, num.position + 15);
          if (textAfter.toLowerCase().includes('km')) {
            stats.distance_walked = num.value;
            console.log(`⚠️ Distance Walked (fallback): ${num.value} km - found near "km"`);
            break;
          }
        }
      }
    }

    // CRITICAL RULE 2: Total XP MUST be the largest number (millions)
    if (!stats.total_xp) {
      const largeNumbers = parsedNumbers.filter(n => 
        !n.isDecimal && n.value > 1000000 && n.value < 1000000000
      );
      if (largeNumbers.length > 0) {
        // Take the largest one
        const xpCandidate = largeNumbers.reduce((max, n) => n.value > max.value ? n : max);
        stats.total_xp = xpCandidate.value;
        console.log(`⚠️ Total XP (fallback): ${xpCandidate.value.toLocaleString()}`);
      }
    }
    // CRITICAL RULE 3: Level extraction - DISABLED
    // We intentionally do NOT extract trainer_level from OCR
    // Trainer level should only be updated manually by the user in their profile settings
    // This prevents accidental level resets during stat updates
    // if (!stats.trainer_level) {
    //   const levelContext = cleanText.match(/(\d{1,2}).*?LEVEL|LEVEL.*?(\d{1,2})/i);
    //   if (levelContext) {
    //     const value = parseInt(levelContext[1] || levelContext[2]);
    //     if (!isNaN(value) && value >= 1 && value <= 80) {
    //       stats.trainer_level = value;
    //       console.log(`⚠️ Trainer Level (fallback): ${value}`);
    //     }
    //   }
    // }

    // CRITICAL RULE 4: Pokémon Caught and PokéStops Visited
    // Use VALUE-BASED heuristics instead of position (more reliable!)
    // In Pokémon GO: Pokémon Caught is typically LARGER than PokéStops Visited
    if (!stats.pokemon_caught || !stats.pokestops_visited) {
      // Lower threshold to 5000 to catch smaller PokéStops values
      const mediumNumbers = parsedNumbers.filter(n => 
        !n.isDecimal && 
        n.value > 5000 &&  // Lowered from 50000 to catch smaller values
        n.value < 1000000 && 
        n.value !== stats.total_xp &&
        n.value !== Math.floor(stats.distance_walked || 0) // Exclude distance
      );

      console.log('📊 Medium numbers found for Pokémon/PokéStops:', mediumNumbers.map(n => `${n.original} (${n.value.toLocaleString()}) at position ${n.position}`));

      if (mediumNumbers.length >= 2) {
        // Sort by VALUE descending (larger number = Pokémon Caught)
        mediumNumbers.sort((a, b) => b.value - a.value);
        
        // HEURISTIC: In Pokémon GO, most players have more Pokémon Caught than PokéStops Visited
        // The LARGER number is almost always Pokémon Caught
        // The SMALLER number is almost always PokéStops Visited
        
        if (!stats.pokemon_caught) {
          stats.pokemon_caught = mediumNumbers[0].value; // Largest = Pokemon
          console.log(`⚠️ Pokémon Caught (fallback - largest value): ${mediumNumbers[0].value.toLocaleString()}`);
        }
        if (!stats.pokestops_visited) {
          stats.pokestops_visited = mediumNumbers[1].value; // Second largest = PokéStops
          console.log(`⚠️ PokéStops Visited (fallback - smaller value): ${mediumNumbers[1].value.toLocaleString()}`);
        }
      } else if (mediumNumbers.length === 1) {
        // Only one medium number found - check context
        console.log('⚠️ Only one medium number found - checking context...');
        const num = mediumNumbers[0];
        const contextBefore = cleanText.substring(Math.max(0, num.position - 60), num.position).toLowerCase();
        const contextAfter = cleanText.substring(num.position, num.position + 20).toLowerCase();
        
        console.log(`Context before: "${contextBefore}"`);
        console.log(`Context after: "${contextAfter}"`);
        
        // Check context for clues
        if (contextBefore.includes('pokemon') || contextBefore.includes('pokémon') || contextBefore.includes('caught')) {
          if (!stats.pokemon_caught) {
            stats.pokemon_caught = num.value;
            console.log(`⚠️ Pokémon Caught (by context): ${num.value.toLocaleString()}`);
          }
        } else if (contextBefore.includes('pokestop') || contextBefore.includes('stop') || contextBefore.includes('visited')) {
          if (!stats.pokestops_visited) {
            stats.pokestops_visited = num.value;
            console.log(`⚠️ PokéStops Visited (by context): ${num.value.toLocaleString()}`);
          }
        } else {
          // No context - use value heuristic (if > 40000, likely Pokemon; if < 40000, likely PokéStops)
          if (num.value > 40000 && !stats.pokemon_caught) {
            stats.pokemon_caught = num.value;
            console.log(`⚠️ Pokémon Caught (by value heuristic - large): ${num.value.toLocaleString()}`);
          } else if (!stats.pokestops_visited) {
            stats.pokestops_visited = num.value;
            console.log(`⚠️ PokéStops Visited (by value heuristic - smaller): ${num.value.toLocaleString()}`);
          }
        }
      }
    }
    
    // VALIDATION: Sanity check - if pokemon_caught < pokestops_visited, they might be swapped
    // This is rare but possible for some play styles, so just log a warning
    if (stats.pokemon_caught && stats.pokestops_visited && stats.pokemon_caught < stats.pokestops_visited) {
      console.log('⚠️ WARNING: Pokémon Caught < PokéStops Visited - unusual but possible');
    }
  }

  console.log('\n📊 Final Extracted Stats:', {
    username: stats.username || 'Not found',
    trainer_level: stats.trainer_level || 'Not found',
    distance_walked: stats.distance_walked ? `${stats.distance_walked} km` : 'Not found',
    pokemon_caught: stats.pokemon_caught?.toLocaleString() || 'Not found',
    pokestops_visited: stats.pokestops_visited?.toLocaleString() || 'Not found',
    total_xp: stats.total_xp?.toLocaleString() || 'Not found',
    start_date: stats.start_date || 'Not found',
  });

  return stats;
};

/**
 * Validate extracted stats against current stats
 */
export const validateExtractedStats = (
  extractedStats: ExtractedStats,
  currentStats: ExtractedStats
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (extractedStats.total_xp && currentStats.total_xp && extractedStats.total_xp < currentStats.total_xp) {
    errors.push('Extracted Total XP is lower than current value');
  }

  if (extractedStats.pokemon_caught && currentStats.pokemon_caught && extractedStats.pokemon_caught < currentStats.pokemon_caught) {
    errors.push('Extracted Pokémon Caught is lower than current value');
  }

  if (extractedStats.distance_walked && currentStats.distance_walked && extractedStats.distance_walked < currentStats.distance_walked) {
    errors.push('Extracted Distance Walked is lower than current value');
  }

  if (extractedStats.pokestops_visited && currentStats.pokestops_visited && extractedStats.pokestops_visited < currentStats.pokestops_visited) {
    errors.push('Extracted PokéStops Visited is lower than current value');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

