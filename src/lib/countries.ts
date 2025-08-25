// Country flags and names mapping
export const COUNTRIES = {
  // América del Norte
  US: { flag: '🇺🇸', name: 'Estados Unidos' },
  CA: { flag: '🇨🇦', name: 'Canadá' },
  MX: { flag: '🇲🇽', name: 'México' },

  // América del Sur
  AR: { flag: '🇦🇷', name: 'Argentina' },
  BR: { flag: '🇧🇷', name: 'Brasil' },
  CL: { flag: '🇨🇱', name: 'Chile' },
  CO: { flag: '🇨🇴', name: 'Colombia' },
  EC: { flag: '🇪🇨', name: 'Ecuador' },
  PE: { flag: '🇵🇪', name: 'Perú' },
  UY: { flag: '🇺🇾', name: 'Uruguay' },
  VE: { flag: '🇻🇪', name: 'Venezuela' },
  PY: { flag: '🇵🇾', name: 'Paraguay' },
  BO: { flag: '🇧🇴', name: 'Bolivia' },

  // Europa
  ES: { flag: '🇪🇸', name: 'España' },
  FR: { flag: '🇫🇷', name: 'Francia' },
  DE: { flag: '🇩🇪', name: 'Alemania' },
  IT: { flag: '🇮🇹', name: 'Italia' },
  GB: { flag: '🇬🇧', name: 'Reino Unido' },
  PT: { flag: '🇵🇹', name: 'Portugal' },
  NL: { flag: '🇳🇱', name: 'Países Bajos' },
  BE: { flag: '🇧🇪', name: 'Bélgica' },
  CH: { flag: '🇨🇭', name: 'Suiza' },
  AT: { flag: '🇦🇹', name: 'Austria' },
  SE: { flag: '🇸🇪', name: 'Suecia' },
  NO: { flag: '🇳🇴', name: 'Noruega' },
  DK: { flag: '🇩🇰', name: 'Dinamarca' },
  FI: { flag: '🇫🇮', name: 'Finlandia' },

  // Asia
  JP: { flag: '🇯🇵', name: 'Japón' },
  KR: { flag: '🇰🇷', name: 'Corea del Sur' },
  CN: { flag: '🇨🇳', name: 'China' },
  IN: { flag: '🇮🇳', name: 'India' },

  // Oceanía
  AU: { flag: '🇦🇺', name: 'Australia' },
  NZ: { flag: '🇳🇿', name: 'Nueva Zelanda' },
} as const;

// Legacy flags mapping for backwards compatibility
export const FLAGS = Object.fromEntries(
  Object.entries(COUNTRIES).map(([code, country]) => [code, country.flag])
) as Record<keyof typeof COUNTRIES, string>;

// Helper functions
export const getCountryFlag = (countryCode: string): string => {
  if (!countryCode) {
    return '';
  }
  const country = COUNTRIES[countryCode as keyof typeof COUNTRIES];
  return country?.flag || '';
};

export const getCountryName = (countryCode: string): string => {
  if (!countryCode) {
    return countryCode || '';
  }
  const country = COUNTRIES[countryCode as keyof typeof COUNTRIES];
  return country?.name || countryCode;
};

export const getCountryOptions = () => {
  return Object.entries(COUNTRIES).map(([code, country]) => ({
    value: code,
    label: `${country.flag} ${country.name}`,
    flag: country.flag,
    name: country.name,
  }));
};

// Popular countries for quick access
export const POPULAR_COUNTRIES = [
  'CL',
  'ES',
  'US',
  'AR',
  'MX',
  'PE',
  'CO',
] as const;
