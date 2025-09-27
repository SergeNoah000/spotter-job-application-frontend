import React, { useState, useEffect, useRef } from 'react';
import { geocodingService, GeocodingResult, Location } from '../services/geocoding';
import './AddressAutocomplete.css';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, location?: Location) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Entrez une adresse...",
  className = "",
  disabled = false,
  label,
  required = false
}) => {
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.length >= 3) {
      timeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const results = await geocodingService.searchAddress(value);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Erreur de recherche d\'adresse:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: GeocodingResult) => {
    const location: Location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lng),
      address: suggestion.display_name
    };
    
    onChange(suggestion.display_name, location);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const position = await geocodingService.getCurrentPosition();
      if (position) {
        onChange(position.address, position);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`address-autocomplete ${className}`}>
      {label && (
        <label className="address-label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="address-input-container">
        <div className="address-input-wrapper">
          <i className="pi pi-map-marker address-input-icon"></i>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => value.length >= 3 && setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="address-input"
          />
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={isLoading}
            className="current-location-btn"
            title="Utiliser ma position actuelle"
          >
            <i className={isLoading ? "pi pi-spin pi-spinner" : "pi pi-compass"}></i>
          </button>
        </div>

        {isLoading && (
          <div className="address-loading">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="address-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`address-suggestion ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="suggestion-main">
                <div className="suggestion-icon">
                  <i className="pi pi-map-marker"></i>
                </div>
                <div className="suggestion-content">
                  <div className="suggestion-text">
                    {formatMainAddress(suggestion)}
                  </div>
                  <div className="suggestion-type">
                    {formatSecondaryAddress(suggestion)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {suggestions.length === 0 && value.length >= 3 && !isLoading && (
            <div className="no-suggestions">
              <i className="pi pi-info-circle"></i>
              <span>Aucune adresse trouvée</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Méthodes utilitaires pour formater l'affichage
  function formatMainAddress(suggestion: GeocodingResult): string {
    const { address } = suggestion;
    
    if (address.road && address.house_number) {
      return `${address.house_number} ${address.road}`;
    } else if (address.road) {
      return address.road;
    } else if (address.city) {
      return address.city;
    }
    
    // Fallback sur display_name tronqué
    const parts = suggestion.display_name.split(',');
    return parts[0] || suggestion.display_name;
  }

  function formatSecondaryAddress(suggestion: GeocodingResult): string {
    const { address } = suggestion;
    const parts = [];
    
    if (address.city && !formatMainAddress(suggestion).includes(address.city)) {
      parts.push(address.city);
    }
    if (address.state) {
      parts.push(address.state);
    }
    if (address.postcode) {
      parts.push(address.postcode);
    }
    
    return parts.slice(0, 2).join(', ') || suggestion.type;
  }
};