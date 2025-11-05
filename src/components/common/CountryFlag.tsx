import React, { useState, useEffect } from 'react';
import { getCountryFlag } from '../../utils/countryFlags';
import type { CountryInfo } from '../../utils/countryFlags';

interface CountryFlagProps {
  countryName: string;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ 
  countryName, 
  size = 40,
  width,
  height,
  className = '' 
}) => {
  // Use custom width/height if provided, otherwise calculate from size
  const flagWidth = width ?? size;
  const flagHeight = height ?? (size * 0.6);
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCountryInfo = async () => {
      setLoading(true);
      try {
        const info = await getCountryFlag(countryName);
        setCountryInfo(info);
      } catch (error) {
        console.error('Error loading country flag:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCountryInfo();
  }, [countryName]);

  if (loading) {
    return (
      <div 
        className={`country-flag-loading ${className}`}
        style={{ 
          width: flagWidth, 
          height: flagHeight, 
          backgroundColor: 'var(--gray-dark)',
          borderRadius: '0px',
          display: 'inline-block'
        }}
      />
    );
  }

  if (!countryInfo) {
    return (
      <div 
        className={`country-flag-fallback ${className}`}
        style={{ 
          width: flagWidth, 
          height: flagHeight, 
          backgroundColor: 'var(--gray-dark)',
          borderRadius: '0px',
          display: 'inline-block',
          fontSize: flagWidth * 0.3,
          textAlign: 'center',
          lineHeight: `${flagHeight}px`,
          color: 'var(--white-muted)'
        }}
      >
        🌍
      </div>
    );
  }

  return (
    <img
      src={countryInfo.flagUrl}
      alt={`Flag of ${countryInfo.name}`}
      title={`${countryInfo.name} (${countryInfo.nativeName})`}
      className={`country-flag ${className}`}
      style={{
        width: flagWidth,
        height: flagHeight,
        objectFit: 'cover',
        borderRadius: '0px',
        border: '1px solid var(--gray-dark)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}
      onError={(e) => {
        // Fallback to globe emoji if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.textContent = '🌍';
        fallback.style.cssText = `
          width: ${flagWidth}px;
          height: ${flagHeight}px;
          background-color: var(--gray-dark);
          border-radius: 0px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: ${flagWidth * 0.3}px;
          color: var(--white-muted);
          border: 1px solid var(--gray-dark);
        `;
        target.parentNode?.insertBefore(fallback, target);
      }}
    />
  );
}; 