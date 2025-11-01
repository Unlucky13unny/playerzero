export interface CountryInfo {
  name: string;
  nativeName: string;
  flagUrl: string;
  code: string;
}

interface CountryFlags {
  [key: string]: CountryInfo;
}

// Enhanced country mapping with native names and flag URLs
const countryFlags: CountryFlags = {
  'us': {
    name: 'United States',
    nativeName: 'United States',
    flagUrl: 'https://flagcdn.com/w40/us.png',
    code: 'US'
  },
  'usa': {
    name: 'United States',
    nativeName: 'United States',
    flagUrl: 'https://flagcdn.com/w40/us.png',
    code: 'US'
  },
  'united states': {
    name: 'United States',
    nativeName: 'United States',
    flagUrl: 'https://flagcdn.com/w40/us.png',
    code: 'US'
  },
  'canada': {
    name: 'Canada',
    nativeName: 'Canada',
    flagUrl: 'https://flagcdn.com/w40/ca.png',
    code: 'CA'
  },
  'united kingdom': {
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    flagUrl: 'https://flagcdn.com/w40/gb.png',
    code: 'GB'
  },
  'uk': {
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    flagUrl: 'https://flagcdn.com/w40/gb.png',
    code: 'GB'
  },
  'england': {
    name: 'England',
    nativeName: 'England',
    flagUrl: 'https://flagcdn.com/w40/gb-eng.png',
    code: 'GB-ENG'
  },
  'scotland': {
    name: 'Scotland',
    nativeName: 'Scotland',
    flagUrl: 'https://flagcdn.com/w40/gb-sct.png',
    code: 'GB-SCT'
  },
  'wales': {
    name: 'Wales',
    nativeName: 'Wales',
    flagUrl: 'https://flagcdn.com/w40/gb-wls.png',
    code: 'GB-WLS'
  },
  'northern ireland': {
    name: 'Northern Ireland',
    nativeName: 'Northern Ireland',
    flagUrl: 'https://flagcdn.com/w40/gb-nir.png',
    code: 'GB-NIR'
  },
  'germany': {
    name: 'Germany',
    nativeName: 'Deutschland',
    flagUrl: 'https://flagcdn.com/w40/de.png',
    code: 'DE'
  },
  'deutschland': {
    name: 'Germany',
    nativeName: 'Deutschland',
    flagUrl: 'https://flagcdn.com/w40/de.png',
    code: 'DE'
  },
  'france': {
    name: 'France',
    nativeName: 'France',
    flagUrl: 'https://flagcdn.com/w40/fr.png',
    code: 'FR'
  },
  'spain': {
    name: 'Spain',
    nativeName: 'España',
    flagUrl: 'https://flagcdn.com/w40/es.png',
    code: 'ES'
  },
  'españa': {
    name: 'Spain',
    nativeName: 'España',
    flagUrl: 'https://flagcdn.com/w40/es.png',
    code: 'ES'
  },
  'italy': {
    name: 'Italy',
    nativeName: 'Italia',
    flagUrl: 'https://flagcdn.com/w40/it.png',
    code: 'IT'
  },
  'italia': {
    name: 'Italy',
    nativeName: 'Italia',
    flagUrl: 'https://flagcdn.com/w40/it.png',
    code: 'IT'
  },
  'japan': {
    name: 'Japan',
    nativeName: '日本',
    flagUrl: 'https://flagcdn.com/w40/jp.png',
    code: 'JP'
  },
  'australia': {
    name: 'Australia',
    nativeName: 'Australia',
    flagUrl: 'https://flagcdn.com/w40/au.png',
    code: 'AU'
  },
  'brazil': {
    name: 'Brazil',
    nativeName: 'Brasil',
    flagUrl: 'https://flagcdn.com/w40/br.png',
    code: 'BR'
  },
  'brasil': {
    name: 'Brazil',
    nativeName: 'Brasil',
    flagUrl: 'https://flagcdn.com/w40/br.png',
    code: 'BR'
  },
  'mexico': {
    name: 'Mexico',
    nativeName: 'México',
    flagUrl: 'https://flagcdn.com/w40/mx.png',
    code: 'MX'
  },
  'méxico': {
    name: 'Mexico',
    nativeName: 'México',
    flagUrl: 'https://flagcdn.com/w40/mx.png',
    code: 'MX'
  },
  'india': {
    name: 'India',
    nativeName: 'भारत',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    code: 'IN'
  },
  'south korea': {
    name: 'South Korea',
    nativeName: '대한민국',
    flagUrl: 'https://flagcdn.com/w40/kr.png',
    code: 'KR'
  },
  'korea': {
    name: 'South Korea',
    nativeName: '대한민국',
    flagUrl: 'https://flagcdn.com/w40/kr.png',
    code: 'KR'
  },
  'netherlands': {
    name: 'Netherlands',
    nativeName: 'Nederland',
    flagUrl: 'https://flagcdn.com/w40/nl.png',
    code: 'NL'
  },
  'nederland': {
    name: 'Netherlands',
    nativeName: 'Nederland',
    flagUrl: 'https://flagcdn.com/w40/nl.png',
    code: 'NL'
  },
  'sweden': {
    name: 'Sweden',
    nativeName: 'Sverige',
    flagUrl: 'https://flagcdn.com/w40/se.png',
    code: 'SE'
  },
  'sverige': {
    name: 'Sweden',
    nativeName: 'Sverige',
    flagUrl: 'https://flagcdn.com/w40/se.png',
    code: 'SE'
  },
  'norway': {
    name: 'Norway',
    nativeName: 'Norge',
    flagUrl: 'https://flagcdn.com/w40/no.png',
    code: 'NO'
  },
  'norge': {
    name: 'Norway',
    nativeName: 'Norge',
    flagUrl: 'https://flagcdn.com/w40/no.png',
    code: 'NO'
  },
  'denmark': {
    name: 'Denmark',
    nativeName: 'Danmark',
    flagUrl: 'https://flagcdn.com/w40/dk.png',
    code: 'DK'
  },
  'danmark': {
    name: 'Denmark',
    nativeName: 'Danmark',
    flagUrl: 'https://flagcdn.com/w40/dk.png',
    code: 'DK'
  },
  'finland': {
    name: 'Finland',
    nativeName: 'Suomi',
    flagUrl: 'https://flagcdn.com/w40/fi.png',
    code: 'FI'
  },
  'suomi': {
    name: 'Finland',
    nativeName: 'Suomi',
    flagUrl: 'https://flagcdn.com/w40/fi.png',
    code: 'FI'
  },
  'poland': {
    name: 'Poland',
    nativeName: 'Polska',
    flagUrl: 'https://flagcdn.com/w40/pl.png',
    code: 'PL'
  },
  'polska': {
    name: 'Poland',
    nativeName: 'Polska',
    flagUrl: 'https://flagcdn.com/w40/pl.png',
    code: 'PL'
  },
  'czech republic': {
    name: 'Czech Republic',
    nativeName: 'Česká republika',
    flagUrl: 'https://flagcdn.com/w40/cz.png',
    code: 'CZ'
  },
  'czechia': {
    name: 'Czech Republic',
    nativeName: 'Česká republika',
    flagUrl: 'https://flagcdn.com/w40/cz.png',
    code: 'CZ'
  },
  'austria': {
    name: 'Austria',
    nativeName: 'Österreich',
    flagUrl: 'https://flagcdn.com/w40/at.png',
    code: 'AT'
  },
  'österreich': {
    name: 'Austria',
    nativeName: 'Österreich',
    flagUrl: 'https://flagcdn.com/w40/at.png',
    code: 'AT'
  },
  'switzerland': {
    name: 'Switzerland',
    nativeName: 'Schweiz',
    flagUrl: 'https://flagcdn.com/w40/ch.png',
    code: 'CH'
  },
  'schweiz': {
    name: 'Switzerland',
    nativeName: 'Schweiz',
    flagUrl: 'https://flagcdn.com/w40/ch.png',
    code: 'CH'
  },
  'belgium': {
    name: 'Belgium',
    nativeName: 'België',
    flagUrl: 'https://flagcdn.com/w40/be.png',
    code: 'BE'
  },
  'belgië': {
    name: 'Belgium',
    nativeName: 'België',
    flagUrl: 'https://flagcdn.com/w40/be.png',
    code: 'BE'
  },
  'portugal': {
    name: 'Portugal',
    nativeName: 'Portugal',
    flagUrl: 'https://flagcdn.com/w40/pt.png',
    code: 'PT'
  },
  'greece': {
    name: 'Greece',
    nativeName: 'Ελλάδα',
    flagUrl: 'https://flagcdn.com/w40/gr.png',
    code: 'GR'
  },
  'ελλάδα': {
    name: 'Greece',
    nativeName: 'Ελλάδα',
    flagUrl: 'https://flagcdn.com/w40/gr.png',
    code: 'GR'
  },
  'turkey': {
    name: 'Turkey',
    nativeName: 'Türkiye',
    flagUrl: 'https://flagcdn.com/w40/tr.png',
    code: 'TR'
  },
  'türkiye': {
    name: 'Turkey',
    nativeName: 'Türkiye',
    flagUrl: 'https://flagcdn.com/w40/tr.png',
    code: 'TR'
  },
  'israel': {
    name: 'Israel',
    nativeName: 'ישראל',
    flagUrl: 'https://flagcdn.com/w40/il.png',
    code: 'IL'
  },
  'ישראל': {
    name: 'Israel',
    nativeName: 'ישראל',
    flagUrl: 'https://flagcdn.com/w40/il.png',
    code: 'IL'
  },
  'saudi arabia': {
    name: 'Saudi Arabia',
    nativeName: 'المملكة العربية السعودية',
    flagUrl: 'https://flagcdn.com/w40/sa.png',
    code: 'SA'
  },
  'uae': {
    name: 'United Arab Emirates',
    nativeName: 'الإمارات العربية المتحدة',
    flagUrl: 'https://flagcdn.com/w40/ae.png',
    code: 'AE'
  },
  'egypt': {
    name: 'Egypt',
    nativeName: 'مصر',
    flagUrl: 'https://flagcdn.com/w40/eg.png',
    code: 'EG'
  },
  'مصر': {
    name: 'Egypt',
    nativeName: 'مصر',
    flagUrl: 'https://flagcdn.com/w40/eg.png',
    code: 'EG'
  },
  'nigeria': {
    name: 'Nigeria',
    nativeName: 'Nigeria',
    flagUrl: 'https://flagcdn.com/w40/ng.png',
    code: 'NG'
  },
  'kenya': {
    name: 'Kenya',
    nativeName: 'Kenya',
    flagUrl: 'https://flagcdn.com/w40/ke.png',
    code: 'KE'
  },
  'morocco': {
    name: 'Morocco',
    nativeName: 'المغرب',
    flagUrl: 'https://flagcdn.com/w40/ma.png',
    code: 'MA'
  },
  'المغرب': {
    name: 'Morocco',
    nativeName: 'المغرب',
    flagUrl: 'https://flagcdn.com/w40/ma.png',
    code: 'MA'
  },
  'south africa': {
    name: 'South Africa',
    nativeName: 'South Africa',
    flagUrl: 'https://flagcdn.com/w40/za.png',
    code: 'ZA'
  },
  'argentina': {
    name: 'Argentina',
    nativeName: 'Argentina',
    flagUrl: 'https://flagcdn.com/w40/ar.png',
    code: 'AR'
  },
  'chile': {
    name: 'Chile',
    nativeName: 'Chile',
    flagUrl: 'https://flagcdn.com/w40/cl.png',
    code: 'CL'
  },
  'colombia': {
    name: 'Colombia',
    nativeName: 'Colombia',
    flagUrl: 'https://flagcdn.com/w40/co.png',
    code: 'CO'
  },
  'peru': {
    name: 'Peru',
    nativeName: 'Perú',
    flagUrl: 'https://flagcdn.com/w40/pe.png',
    code: 'PE'
  },
  'perú': {
    name: 'Peru',
    nativeName: 'Perú',
    flagUrl: 'https://flagcdn.com/w40/pe.png',
    code: 'PE'
  },
  'venezuela': {
    name: 'Venezuela',
    nativeName: 'Venezuela',
    flagUrl: 'https://flagcdn.com/w40/ve.png',
    code: 'VE'
  },
  'uruguay': {
    name: 'Uruguay',
    nativeName: 'Uruguay',
    flagUrl: 'https://flagcdn.com/w40/uy.png',
    code: 'UY'
  },
  'paraguay': {
    name: 'Paraguay',
    nativeName: 'Paraguay',
    flagUrl: 'https://flagcdn.com/w40/py.png',
    code: 'PY'
  },
  'ecuador': {
    name: 'Ecuador',
    nativeName: 'Ecuador',
    flagUrl: 'https://flagcdn.com/w40/ec.png',
    code: 'EC'
  },
  'bolivia': {
    name: 'Bolivia',
    nativeName: 'Bolivia',
    flagUrl: 'https://flagcdn.com/w40/bo.png',
    code: 'BO'
  },
  'singapore': {
    name: 'Singapore',
    nativeName: 'Singapore',
    flagUrl: 'https://flagcdn.com/w40/sg.png',
    code: 'SG'
  },
  'malaysia': {
    name: 'Malaysia',
    nativeName: 'Malaysia',
    flagUrl: 'https://flagcdn.com/w40/my.png',
    code: 'MY'
  },
  'thailand': {
    name: 'Thailand',
    nativeName: 'ประเทศไทย',
    flagUrl: 'https://flagcdn.com/w40/th.png',
    code: 'TH'
  },
  'ประเทศไทย': {
    name: 'Thailand',
    nativeName: 'ประเทศไทย',
    flagUrl: 'https://flagcdn.com/w40/th.png',
    code: 'TH'
  },
  'vietnam': {
    name: 'Vietnam',
    nativeName: 'Việt Nam',
    flagUrl: 'https://flagcdn.com/w40/vn.png',
    code: 'VN'
  },
  'việt nam': {
    name: 'Vietnam',
    nativeName: 'Việt Nam',
    flagUrl: 'https://flagcdn.com/w40/vn.png',
    code: 'VN'
  },
  'philippines': {
    name: 'Philippines',
    nativeName: 'Pilipinas',
    flagUrl: 'https://flagcdn.com/w40/ph.png',
    code: 'PH'
  },
  'pilipinas': {
    name: 'Philippines',
    nativeName: 'Pilipinas',
    flagUrl: 'https://flagcdn.com/w40/ph.png',
    code: 'PH'
  },
  'indonesia': {
    name: 'Indonesia',
    nativeName: 'Indonesia',
    flagUrl: 'https://flagcdn.com/w40/id.png',
    code: 'ID'
  },
  'new zealand': {
    name: 'New Zealand',
    nativeName: 'New Zealand',
    flagUrl: 'https://flagcdn.com/w40/nz.png',
    code: 'NZ'
  },
  'ireland': {
    name: 'Ireland',
    nativeName: 'Éire',
    flagUrl: 'https://flagcdn.com/w40/ie.png',
    code: 'IE'
  },
  'éire': {
    name: 'Ireland',
    nativeName: 'Éire',
    flagUrl: 'https://flagcdn.com/w40/ie.png',
    code: 'IE'
  },
  'pakistan': {
    name: 'Pakistan',
    nativeName: 'پاکستان',
    flagUrl: 'https://flagcdn.com/w40/pk.png',
    code: 'PK'
  },
  'پاکستان': {
    name: 'Pakistan',
    nativeName: 'پاکستان',
    flagUrl: 'https://flagcdn.com/w40/pk.png',
    code: 'PK'
  }
};

// Cache for API responses
const countryCache = new Map<string, CountryInfo>();

/**
 * Get country flag information with fallback to API
 */
export const getCountryFlag = async (countryName: string): Promise<CountryInfo> => {
  if (!countryName) {
    return {
      name: 'Unknown',
      nativeName: 'Unknown',
      flagUrl: 'https://flagcdn.com/w40/xx.png', // Generic flag
      code: 'XX'
    };
  }

  const normalizedCountry = countryName.toLowerCase().trim();

  // Check local cache first
  if (countryCache.has(normalizedCountry)) {
    return countryCache.get(normalizedCountry)!;
  }

  // Check predefined mappings
  if (countryFlags[normalizedCountry]) {
    const countryInfo = countryFlags[normalizedCountry];
    countryCache.set(normalizedCountry, countryInfo);
    return countryInfo;
  }

  // Try to fetch from API
  try {
    const countryInfo = await fetchCountryFromAPI(normalizedCountry);
    if (countryInfo) {
      countryCache.set(normalizedCountry, countryInfo);
      return countryInfo;
    }
  } catch (error) {
    console.warn('Failed to fetch country from API:', error);
  }

  // Fallback to generic flag
  const fallbackInfo = {
    name: countryName,
    nativeName: countryName,
    flagUrl: 'https://flagcdn.com/w40/xx.png',
    code: 'XX'
  };
  
  countryCache.set(normalizedCountry, fallbackInfo);
  return fallbackInfo;
};

/**
 * Fetch country information from REST Countries API
 */
const fetchCountryFromAPI = async (countryName: string): Promise<CountryInfo | null> => {
  try {
    const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
    
    if (!response.ok) {
      return null;
    }

    const countries = await response.json();
    
    if (countries && countries.length > 0) {
      const country = countries[0];
      return {
        name: country.name.common,
        nativeName: country.name.nativeName?.[Object.keys(country.name.nativeName)[0]]?.common || country.name.common,
        flagUrl: `https://flagcdn.com/w40/${country.cca2.toLowerCase()}.png`,
        code: country.cca2
      };
    }
  } catch (error) {
    console.error('Error fetching country from API:', error);
  }

  return null;
};



// Export for backward compatibility
export const getCountryFlagSync = (countryName: string): CountryInfo => {
  if (!countryName) {
    return {
      name: 'Unknown',
      nativeName: 'Unknown',
      flagUrl: 'https://flagcdn.com/w40/xx.png',
      code: 'XX'
    };
  }

  const normalizedCountry = countryName.toLowerCase().trim();
  return countryFlags[normalizedCountry] || {
    name: countryName,
    nativeName: countryName,
    flagUrl: 'https://flagcdn.com/w40/xx.png',
    code: 'XX'
  };
}; 