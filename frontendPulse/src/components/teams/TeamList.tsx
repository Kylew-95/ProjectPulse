import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Users, Trash2, Edit2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Sparkles, Search, X } from 'lucide-react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel,
  flexRender, 
  createColumnHelper,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn
} from '@tanstack/react-table';
import { useAuth } from '../../context/AuthContext';
import ResourceCard from '../common/ResourceCard';

const TEAM_ROLES_OPTIONS = ['Admin', 'Developer', 'Designer', 'Viewer']; 

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  discord_id: string | null;
  role: string;
  status: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  avatar_url?: string | null;
}

interface Team {
  id: string;
  name: string;
  members?: {
    id: string;
    user_id: string;
    avatar_url: string | null;
    profiles?: {
      avatar_url: string | null;
    } | null;
  }[];
}

interface TeamListProps {
  viewMode: 'teams' | 'members';
  loading: boolean;
  members: TeamMember[];
  teams: Team[];
  onUpdateRole: (memberId: string, role: string) => void;
  onRemoveMember: (memberId: string) => void;
  onDeleteTeam: (teamId: string) => void;
}

const TeamList = ({
  viewMode,
  loading,
  members,
  teams,
  onRemoveMember,
  onDeleteTeam,
}: TeamListProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // -- Members Table Setup --
  const columnHelper = createColumnHelper<TeamMember>();

  const columns = useMemo(() => [
    columnHelper.accessor('profiles.full_name', {
      header: 'Name',
      cell: info => {
        const profile = info.row.original.profiles;
        const avatarUrl = (info.row.original.user_id === user?.id ? user?.user_metadata?.avatar_url : null) || 
                          info.row.original.avatar_url || 
                          profile?.avatar_url;
        
        return (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600 shrink-0">
               {avatarUrl ? (
                 <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                   {profile?.full_name?.[0] || info.row.original.email[0].toUpperCase()}
                 </span>
               )}
             </div>
             <div className="flex flex-col">
               <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                 {profile?.full_name || info.row.original.email.split('@')[0]}
               </span>
               <span className="text-xs text-slate-500 dark:text-slate-400">
                 {info.row.original.email}
               </span>
             </div>
          </div>
        );
      }
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: info => {
        const role = info.getValue();
        const isAdmin = role === 'Admin';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isAdmin 
              ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' 
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {role}
          </span>
        );
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const isActive = status === 'active';
        return (
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
              {status}
            </span>
          </div>
        );
      }
    }),
    columnHelper.accessor('discord_id', {
      header: 'Discord ID',
      cell: info => (
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
          {info.getValue() || '—'}
        </span>
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => {
        const isSelf = info.row.original.user_id === user?.id;
        const isAdmin = info.row.original.role === 'Admin';
        
        // Cannot delete yourself or other Admins (unless you are an Admin, logic handled by backend mostly, but visual cue here)
        if (isAdmin || isSelf) return null;

        return (
           <div className="flex justify-end">
             <button 
                onClick={(e) => { e.stopPropagation(); onRemoveMember(info.row.original.id); }}
                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Remove Member"
             >
               <Trash2 size={14} />
             </button>
           </div>
        );
      }
    })
  ], [user, onRemoveMember]);

  const table = useReactTable({
    data: members,
    columns,
    state: { 
      sorting,
      globalFilter,
      columnFilters
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    // Custom global filter to search multiple fields including nested profiles
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const email = (row.getValue('email') as string)?.toLowerCase() || '';
      const role = (row.getValue('role') as string)?.toLowerCase() || '';
      const discordId = (row.original.discord_id)?.toLowerCase() || '';
      const fullName = (row.original.profiles?.full_name)?.toLowerCase() || '';
      
      return email.includes(search) || 
             role.includes(search) || 
             discordId.includes(search) || 
             fullName.includes(search);
    }, 
  });

  // -- Loading State --
  if (loading) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/5">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
        <span className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Loading workspace data...</span>
      </div>
    );
  }

  // -- Teams View (Grid) --
  if (viewMode === 'teams') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-[#0f172a] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
            <Shield size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No workspaces found</p>
          </div>
        ) : (
          teams.map((team) => (
            <ResourceCard
              key={team.id}
              title={team.name}
              description="Manage members and projects in this workspace."
              icon={Shield}
              decorationIcon={User}
              decorationSize={240}
              onClick={() => navigate(`/dashboard/team/${team.id}`)}
              onDelete={() => onDeleteTeam(team.id)}
              actionLabel="View Workspace"
              footer={
                <div className="flex -space-x-2 mb-6 min-h-[32px]">
                   {(team.members || []).slice(0, 3).map((member) => {
                     const avatarUrl = (member.user_id === user?.id ? user?.user_metadata?.avatar_url : null) || 
                        member.avatar_url || 
                        member.profiles?.avatar_url;
                     
                     return (
                        <div key={member.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                          {avatarUrl ? (
                             <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                             <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">?</span>
                          )}
                        </div>
                     );
                   })}
                   {(team.members?.length || 0) > 3 && (
                     <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                       +{(team.members?.length || 0) - 3}
                     </div>
                   )}
                </div>
              }
            />
          ))
        )}
      </div>
    );
  }

  // -- Members View (Table) --
  return (
    <div className="flex flex-col gap-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100"
          />
          {globalFilter && (
            <button 
              onClick={() => setGlobalFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={(table.getColumn('role')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('role')?.setFilterValue(e.target.value || undefined)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">All Roles</option>
            {TEAM_ROLES_OPTIONS.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('status')?.setFilterValue(e.target.value || undefined)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          {(columnFilters.length > 0 || globalFilter) && (
             <button
                onClick={() => {
                    setGlobalFilter('');
                    setColumnFilters([]);
                }}
                className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
             >
                Reset
             </button>
          )}
        </div>
      </div>

      <div className="w-full bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-white/5">
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors cursor-pointer select-none group first:pl-6 last:pr-6"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                   <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                          <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              {{
                                  asc: <ArrowUp size={12} />,
                                  desc: <ArrowDown size={12} />,
                              }[header.column.getIsSorted() as string] ?? <ArrowUpDown size={12} />}
                          </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {table.getRowModel().rows.length === 0 ? (
               <tr>
                <td colSpan={columns.length} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                        <Users size={40} className="text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No members found</p>
                    </div>
                </td>
               </tr>
            ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 first:pl-6 last:pr-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
      </div>
      
      {/* Pagination Controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/5">
             <div className="flex items-center gap-2">
                <button
                    className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </button>
                <button
                    className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </button>
             </div>
             <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
             </span>
        </div>
      )}
    </div>
  );
};

export default TeamList;
