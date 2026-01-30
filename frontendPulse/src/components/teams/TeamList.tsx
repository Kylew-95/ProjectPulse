import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Users, Trash2, Edit2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel,
  flexRender, 
  createColumnHelper,
  type SortingState 
} from '@tanstack/react-table';
import { useAuth } from '../../context/AuthContext';
import ResourceCard from '../common/ResourceCard';

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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true, // Pagination controlled by parent
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
  );
};

export default TeamList;
