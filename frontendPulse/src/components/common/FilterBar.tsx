import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onClearSearch?: () => void;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
}

export default function FilterBar({ 
  searchQuery, 
  onSearchChange,
  onClearSearch, // Add generic clear support
  placeholder = "Search...", 
  children,
  className = ''
}: FilterBarProps) {
  return (
    <div className={`flex flex-col lg:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-6 shadow-sm ${className}`}>
      <div className="relative w-full lg:max-w-md group">
        {onSearchChange && (
          <>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
            {searchQuery && onClearSearch && (
                <button 
                    onClick={onClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <X size={14} />
                </button>
            )}
            {/* Fallback clear if onClearSearch not provided but we have query and onChange */}
            {searchQuery && !onClearSearch && onSearchChange && (
                <button 
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <X size={14} />
                </button>
            )}
          </>
        )}
      </div>
      
      <div className="flex items-center gap-3 w-full lg:w-auto justify-end overflow-x-auto pb-2 lg:pb-0">
        {children}
      </div>
    </div>
  );
}
