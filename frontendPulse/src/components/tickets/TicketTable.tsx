import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Ticket } from '../../types/ticket';

interface TicketTableProps {
  tickets: Ticket[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string | number) => Promise<void>;
}

const TicketTable = ({ 
  tickets, 
  loading,
  totalCount,
  currentPage,
  pageSize,
  onEdit,
  onDelete
}: TicketTableProps) => {
  const { user } = useAuth();
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const columnHelper = createColumnHelper<Ticket>();

  const columns = useMemo(() => [
    columnHelper.accessor('title', {
      header: 'Title',
      cell: info => {
        // Calculate absolute index if needed, or just use ID
        const absIndex = totalCount - (info.row.index + (currentPage - 1) * pageSize);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate max-w-[200px] md:max-w-[300px]">
              {info.getValue()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
              TICK-{absIndex}
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
        }
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
        }
    }),
    columnHelper.accessor(row => row.team?.name || row.teams?.name || '—', {
        id: 'team',
        header: 'Team',
        cell: info => <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{info.getValue()}</span>
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
  ], [totalCount, currentPage, pageSize, user, onEdit, onDelete]);

  const table = useReactTable({
    data: tickets,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // Client-side sorting for current page data
    // Manual pagination is handled by parent, so we don't use getPaginationRowModel here unless we want client-side pagination
    manualPagination: true,
  });

  if (loading) {
     return (
        <div className="w-full h-96 flex flex-col items-center justify-center bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Loading tickets...</p>
        </div>
     );
  }

  return (
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
  );
};

export default TicketTable;
