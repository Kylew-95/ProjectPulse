import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Trash2, Shield, User } from 'lucide-react';
import { useTable, type Column } from 'react-table';
import { useTheme } from '../../context/ThemeContext';
import ResourceCard from '../common/ResourceCard';
import SearchableSelect from '../ui/SearchableSelect';
import { TEAM_ROLES } from '../../constants/roles';

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
}

interface Team {
  id: string;
  name: string;
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
  onUpdateRole,
  onRemoveMember,
  onDeleteTeam,
}: TeamListProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const data = useMemo(() => members, [members]);

  const columns = useMemo<Column<TeamMember>[]>(() => [
    {
      Header: "Member Identity",
      accessor: "profiles",
      Cell: ({ row, value }: any) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 relative shrink-0">
              <img 
                src={value?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`} 
                alt={`${value?.full_name || 'Member'}'s avatar`} 
                className="w-full h-full rounded-full object-cover"
              />
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true"></div>
            </div>
            <div className="flex flex-col justify-center gap-0.5">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-none">
                {value?.full_name || member.email.split('@')[0]}
              </div>
              <div className="text-xs text-slate-500 leading-none">{member.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      Header: "Role",
      accessor: "role",
      Cell: ({ row, value }: any) => {
        const member = row.original;
        return (
           <div className="w-40">
             <SearchableSelect
                options={TEAM_ROLES.map(role => ({ value: role, label: role }))}
                value={value}
                onChange={(role) => onUpdateRole(member.id, role)}
                className="w-full text-xs h-8"
              />
           </div>
        );
      }
    },
    {
      Header: "Discord ID",
      accessor: "discord_id",
      Cell: ({ value }: any) => {
         return (
            <span className="text-xs font-mono text-slate-500">
               {value || <span className="opacity-30">-</span>}
            </span>
         );
      }
    },
    {
      Header: "Status",
      accessor: "status",
      Cell: ({ value }: any) => {
         return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ring-1 ring-inset ${
              value === 'active' 
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20' 
                : 'bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-400/10 dark:text-slate-400 dark:ring-slate-400/20'
            }`}>
              {value}
            </span>
         );
      }
    },
    {
      Header: "Actions",
      id: 'actions',
      Cell: ({ row }: any) => {
         return (
            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={() => onRemoveMember(row.original.id)}
                 className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-md"
                 aria-label={`Remove ${row.original.profiles?.full_name || row.original.email}`}
               >
                 <Trash2 size={14} aria-hidden="true" />
               </button>
            </div>
         );
      }
    }
  ], [onUpdateRole, onRemoveMember]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data });

  if (loading) {
    return (
      <div className="px-6 py-24 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-text-secondary text-sm font-medium">Loading teams...</span>
        </div>
      </div>
    );
  }

  if (viewMode === 'teams') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-surface border border-border-main rounded-2xl border-dashed">
            <Users size={40} className="mx-auto mb-4 text-text-secondary opacity-20" />
            <p className="text-text-secondary text-sm font-bold">No workspaces found</p>
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
                <div className="flex -space-x-1.5 mb-6">
                   {[1,2].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-surface bg-background flex items-center justify-center text-[8px] font-bold text-text-secondary">U{i}</div>
                   ))}
                   <div className="pl-3 text-[10px] font-bold text-text-secondary opacity-50">+ 12 more</div>
                </div>
              }
            />
          ))
        )}
      </div>
    );
  }

  // Members View (Table)
  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
      <div className="overflow-x-visible"> {/* Visible overflow for dropdowns */}
        <table {...getTableProps()} className="w-full text-left border-collapse">
          <thead>
            {headerGroups.map(headerGroup => {
              const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
              return (
              <tr key={key} {...restHeaderGroupProps} className="bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
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
                   No members found
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
                      className="group border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
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

export default TeamList;
