import React from 'react';
import { Filter, CheckCircle2, AlertCircle, LayoutGrid, Table as TableIcon } from 'lucide-react';
import FilterDropdown from '../ui/FilterDropdown';
import FilterBar from '../common/FilterBar';

interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TicketFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedTeamId?: string;
  setSelectedTeamId?: (val: string) => void;
  teamOptions?: { value: string; label: string }[];
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  statusOptions: Option[];
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  priorityOptions: Option[];
  viewMode: 'table' | 'list';
  setViewMode: (mode: 'table' | 'list') => void;
}

const TicketFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  statusOptions,
  priorityFilter,
  setPriorityFilter,
  priorityOptions,
  viewMode,
  setViewMode
}: TicketFiltersProps) => {
  return (
    <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search tickets by title, ID or requester..."
        onClearSearch={() => setSearchQuery('')}
    >
        <div className="flex items-center gap-2">
            <FilterDropdown 
            label="Status" 
            options={statusOptions} 
            selectedId={statusFilter} 
            onSelect={setStatusFilter}
            icon={<CheckCircle2 size={16} />}
            />
            <FilterDropdown 
            label="Priority" 
            options={priorityOptions} 
            selectedId={priorityFilter} 
            onSelect={setPriorityFilter}
            icon={<AlertCircle size={16} />}
            />
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2 hidden sm:block"></div>
        
        <button 
            className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 text-sm font-medium transition-all"
            onClick={() => {
              setStatusFilter('all');
              setPriorityFilter('all');
              setSearchQuery('');
            }}
        >
            <Filter size={16} aria-hidden="true" />
            Reset
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2 hidden sm:block"></div>
        
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
             <button
               onClick={() => setViewMode('table')}
               className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
               title="Table View"
             >
                <TableIcon size={16} />
             </button>
             <button
               onClick={() => setViewMode('list')}
               className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
               title="Gallery View"
             >
                <LayoutGrid size={16} />
             </button>
        </div>
    </FilterBar>
  );
};

export default TicketFilters;
