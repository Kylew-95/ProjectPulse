import { ExternalLink, UserCheck, UserX } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import FilterDropdown from '../ui/FilterDropdown';
import FilterBar from '../common/FilterBar';
import { TEAM_ROLES } from '../../constants/roles';

interface TeamFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  setIsPermissionsModalOpen: (val: boolean) => void;
}

const TeamFilters = ({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  setIsPermissionsModalOpen
}: TeamFiltersProps) => {
  return (
    <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by name, email or discord..."
        onClearSearch={() => setSearchQuery('')}
    >
      <div className="min-w-[160px]">
        <SearchableSelect
          options={[
            { value: 'all', label: 'All Roles' },
            ...TEAM_ROLES.map(role => ({ value: role, label: role }))
          ]}
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="Filter by Role"
        />
      </div>

      <FilterDropdown 
          label="Status" 
          options={[
              { id: 'all', label: 'All Statuses' },
              { id: 'active', label: 'Active', icon: <UserCheck size={14} className="text-emerald-500" /> },
              { id: 'inactive', label: 'Inactive', icon: <UserX size={14} className="text-gray-500" /> }
          ]} 
          selectedId={statusFilter} 
          onSelect={setStatusFilter} 
      />
      
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2 hidden sm:block"></div>

      <button 
        onClick={() => setIsPermissionsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium"
      >
        Manage permissions <ExternalLink size={14} className="opacity-50" />
      </button>
    </FilterBar>
  );
};

export default TeamFilters;
