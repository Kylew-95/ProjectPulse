import { useMemo } from 'react';
import { useTable } from 'react-table';
import type { Column } from 'react-table';
import { Edit2, Trash2 } from 'lucide-react';
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
  onSortByUrgency: () => void;
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


  const data = useMemo(() => tickets, [tickets]);

  const columns = useMemo<Column<Ticket>[]>(() => [
    {
      Header: "Title",
      accessor: "title",
      Cell: ({ row, value }: any) => {
        // Calculate absolute index based on pagination
        // row.index is 0-based index in the current page
        const absIndex = totalCount - (row.index + (currentPage - 1) * pageSize);
        return (
          <div className="flex flex-col justify-center gap-0.5 py-1.5">
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{value}</span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">TICK-{absIndex}</span>
          </div>
        );
      }
    },
    {
      Header: "Status",
      accessor: "status",
      Cell: ({ value }: any) => {
        const isDone = value === 'done';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ring-1 ring-inset ${
            isDone 
             ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20' 
             : 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20'
          }`}>
            {value?.replace('_', ' ')}
          </span>
        );
      }
    },
    {
      Header: "Priority",
      accessor: 'priority',
      Cell: ({ value }: any) => {
         const colorClass = 
            value === 'critical' ? 'text-red-600 dark:text-red-400' :
            value === 'high' ? 'text-orange-600 dark:text-orange-400' :
            value === 'medium' ? 'text-blue-600 dark:text-blue-400' :
            'text-slate-500';
         return (
              <span className={`text-xs font-semibold uppercase ${colorClass}`}>
                {value}
              </span>
         );
      }
    },
    {
      Header: "Team",
      id: 'team',
      accessor: (row: Ticket) => row.team?.name || row.teams?.name || '—',
      Cell: ({ value }: any) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">{value}</span>
      )
    },
    {
      Header: "Assignee",
      accessor: 'assignee_profile',
      Cell: ({ row, value }: any) => {
        if (!value) return <span className="text-xs text-slate-400 italic">Unassigned</span>;
        
        const isCurrentUser = row.original.assignee_id === user?.id;
        const avatarUrl = (isCurrentUser ? user?.user_metadata?.avatar_url : null) || value.avatar_url;

        return (
           <div className="flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600 overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    value.full_name?.[0] || '?'
                  )}
               </div>
               <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{value.full_name}</span>
           </div>
        );
      }
    },
    {
       Header: "Urgency",
       accessor: 'urgency_score',
       Cell: ({ value }: any) => {
         const score = value || 0;
         const color = score > 7 ? 'bg-red-500' : score > 4 ? 'bg-amber-500' : 'bg-emerald-500';
         return (
            <div className="flex items-center gap-2">
                <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className={`h-full rounded-full ${color}`} style={{ width: `${score * 10}%` }} />
                </div>
                <span className="text-xs text-slate-500 font-mono">{score.toFixed(1)}</span>
            </div>
         );
       }
    },
    {
      Header: "Actions",
      id: 'actions',
      Cell: ({ row }: any) => {
         return (
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
               >
                 <Edit2 size={14} />
               </button>
               <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(row.original.id); }}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
               >
                 <Trash2 size={14} />
               </button>
            </div>
         );
      }
    }
  ], [totalCount, currentPage, pageSize, onEdit, onDelete, user]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data });

  if (loading) {
     return (
        <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-12 flex justify-center items-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span className="text-sm text-slate-500">Loading tickets...</span>
            </div>
        </div>
     );
  }

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="w-full text-left border-collapse">
          <thead>
            {headerGroups.map(headerGroup => {
              const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
              return (
              <tr key={key} {...restHeaderGroupProps} className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                {headerGroup.headers.map(column => {
                  const { key: colKey, ...restColProps } = column.getHeaderProps();
                  return (
                  <th 
                    key={colKey} 
                    {...restColProps}
                    className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {column.render('Header')}
                  </th>
                )})}
              </tr>
            )})}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.length === 0 ? (
               <tr>
                 <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 text-sm">
                   No tickets found
                 </td>
               </tr>
            ) : (
                rows.map(row => {
                  prepareRow(row);
                  const { key, ...restRowProps } = row.getRowProps();
                  return (
                    <tr 
                      key={key} 
                      {...restRowProps}
                      onClick={() => onEdit(row.original)}
                      className="group border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {row.cells.map(cell => {
                        const { key: cellKey, ...restCellProps } = cell.getCellProps();
                        return (
                        <td 
                          key={cellKey}
                          {...restCellProps}
                          className="px-4 py-2.5"
                        >
                          {cell.render('Cell')}
                        </td>
                      )})}
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketTable;
