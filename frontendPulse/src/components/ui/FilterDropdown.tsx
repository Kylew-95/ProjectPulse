import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterDropdownProps {
  label: string;
  options: Option[];
  selectedId: string;
  onSelect: (id: string) => void;
  icon?: React.ReactNode;
}

const FilterDropdown = ({ label, options, selectedId, onSelect, icon }: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === selectedId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all text-sm font-medium border border-transparent hover:border-white/10"
      >
        {icon && <span className="opacity-50 group-hover:opacity-100">{icon}</span>}
        <span className={selectedId !== 'all' ? 'text-primary font-bold' : ''}>
          {selectedId === 'all' ? label : selectedOption?.label}
        </span>
        <ChevronDown size={14} className={`opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onSelect(option.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:bg-primary/20 hover:text-white transition-all text-left group"
            >
              <div className="flex items-center gap-2">
                {option.icon && <span className="opacity-70 group-hover:opacity-100">{option.icon}</span>}
                <span>{option.label}</span>
              </div>
              {selectedId === option.id && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
