import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { searchInArabicText } from '../utils/arabicUtils';

interface Option {
  id: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "اختر من القائمة...",
  className = "",
  disabled = false,
  required = false,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // تصفية الخيارات بناءً على البحث
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        searchInArabicText(option.label, searchTerm) ||
        (option.subtitle && searchInArabicText(option.subtitle, searchTerm))
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.id === value);

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* الحقل الرئيسي */}
      <div
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer transition-colors ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : isOpen 
            ? 'border-moe-500 ring-2 ring-moe-500 ring-opacity-20' 
            : 'hover:border-gray-400'
        }`}
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedOption ? (
              <div>
                <span className="text-gray-800">{selectedOption.label}</span>
                {selectedOption.subtitle && (
                  <span className="text-sm text-gray-500 mr-2">- {selectedOption.subtitle}</span>
                )}
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </div>

      {/* القائمة المنسدلة */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* حقل البحث */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* قائمة الخيارات */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                لا توجد نتائج
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-full text-right px-3 py-2 hover:bg-moe-50 transition-colors ${
                    value === option.id ? 'bg-moe-100 text-moe-800' : 'text-gray-800'
                  }`}
                >
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-sm text-gray-500">{option.subtitle}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* حقل مخفي للنماذج */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required && !value}
        />
      )}
    </div>
  );
};