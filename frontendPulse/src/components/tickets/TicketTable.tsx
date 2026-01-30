import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState
} from '@tanstack/react-table';
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Sparkles, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Ticket } from '../../types/ticket';

interface TicketTableProps {
  tickets: Ticket[];
  loading: boolean;
  userTeams: { id: string; name: string }[];
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string | number) => Promise<void>;
}

const TicketTable = ({ 
  tickets, 
  loading,
  userTeams,
  onEdit,
  onDelete
}: TicketTableProps) => {
  const { user } = useAuth();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columnHelper = createColumnHelper<Ticket>();

  const columns = useMemo(() => [
    columnHelper.accessor('title', {
      header: 'Title',
      cell: info => {
        // We don't have totalCount from server anymore, so we calculate index based on current rows?
        // Actually, we can just use the ticket ID or a relative index if we want.
        // For now, let's just show the Tick ID if it exists or generic ID.
        // Or just the title.
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate max-w-[200px] md:max-w-[300px]">
              {info.getValue()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
              ID: {info.row.original.id}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
            const status = info.getValue() as string;
            const isDone = status === 'done';
            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize ring-1 ring-inset ${
                    isDone 
                     ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20' 
                     : 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20'
                  }`}>
                    {status.replace('_', ' ')}
                  </span>
            );
        },
        filterFn: 'equals'
    }),
    columnHelper.accessor('priority', {
        header: 'Priority',
        cell: info => {
            const priority = info.getValue() as string;
            const colorClass = 
                priority === 'critical' ? 'text-red-600 dark:text-red-400' :
                priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                priority === 'medium' ? 'text-blue-600 dark:text-blue-400' :
                'text-slate-500 dark:text-slate-400';
            
            return (
                <span className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>
                    {priority}
                </span>
            );
        },
        filterFn: 'equals'
    }),
    columnHelper.accessor(row => row.team?.name || row.teams?.name || '—', {
        id: 'team',
        header: 'Team',
        cell: info => <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{info.getValue()}</span>,
        filterFn: (row, _columnId, filterValue) => {
             // Custom filter for team name or team id matching
             // If filterValue is team ID, we might need to check row.original.team_id?
             // But the dropdown sends ID.
             if (filterValue === 'all') return true;
             // If we want to filter by ID, we should better accessor the ID.
             // But let's check against team ID on original row
             return row.original.team_id === filterValue;
        }
    }),
    columnHelper.accessor('assignee_profile', {
        header: 'Assignee',
        cell: info => {
            const profile = info.getValue();
            if (!profile) return <span className="text-xs text-slate-400 italic">Unassigned</span>;

            const isCurrentUser = info.row.original.assignee_id === user?.id;
            const avatarUrl = (isCurrentUser ? user?.user_metadata?.avatar_url : null) || profile.avatar_url;

            return (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                {profile.full_name?.[0] || '?'}
                            </span>
                        )}
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                        {profile.full_name}
                    </span>
                </div>
            );
        }
    }),
    columnHelper.accessor('urgency_score', {
        header: 'Urgency',
        cell: info => {
            const score = info.getValue() || 0;
            const color = score > 7 ? 'bg-red-500' : score > 4 ? 'bg-amber-500' : 'bg-emerald-500';
            return (
                <div className="flex items-center gap-2 w-full max-w-[120px]">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${color} transition-all duration-500`} 
                            style={{ width: `${Math.min(score * 10, 100)}%` }} 
                        />
                    </div>
                    <span className="text-xs text-slate-500 font-mono w-6 text-right">{score.toFixed(1)}</span>
                </div>
            );
        }
    }),
    columnHelper.display({
        id: 'actions',
        header: '',
        cell: info => (
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(info.row.original); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Edit Ticket"
               >
                 <Edit2 size={14} />
               </button>
               <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(info.row.original.id); }}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Delete Ticket"
               >
                 <Trash2 size={14} />
               </button>
            </div>
        )
    })
  ], [user, onEdit, onDelete]);

  const table = useReactTable({
    data: tickets,
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
    globalFilterFn: (row, _columnId, filterValue) => {
        const search = filterValue.toLowerCase();
        const title = (row.getValue('title') as string)?.toLowerCase() || '';
        const status = (row.getValue('status') as string)?.toLowerCase() || '';
        const priority = (row.getValue('priority') as string)?.toLowerCase() || '';
        const assignee = (row.original.assignee_profile?.full_name)?.toLowerCase() || '';
        const teamName = (row.original.team?.name || row.original.teams?.name)?.toLowerCase() || '';

        return title.includes(search) || 
               status.includes(search) ||
               priority.includes(search) ||
               assignee.includes(search) ||
               teamName.includes(search);
    }
  });

  if (loading) {
     return (
        <div className="w-full h-96 flex flex-col items-center justify-center bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Loading tickets...</p>
        </div>
     );
  }

  // Define options for dropdowns
  const STATUS_OPTIONS = ['open', 'in_progress', 'done'];
  const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

  return (
    <div className="flex flex-col gap-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search tickets..."
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Team Filter */}
           <select
            value={(table.getColumn('team')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('team')?.setFilterValue(e.target.value || undefined)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">All Teams</option>
            {userTeams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('status')?.setFilterValue(e.target.value || undefined)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>

           {/* Priority Filter */}
           <select
            value={(table.getColumn('priority')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('priority')?.setFilterValue(e.target.value || undefined)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
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
                            <Sparkles size={40} className="text-slate-300 dark:text-slate-600" />
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No tickets found</p>
                        </div>
                    </td>
                </tr>
            ) : (
                table.getRowModel().rows.map(row => (
                <tr 
                    key={row.id} 
                    className="group bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => onEdit(row.original)}
                >
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

export default TicketTable;
