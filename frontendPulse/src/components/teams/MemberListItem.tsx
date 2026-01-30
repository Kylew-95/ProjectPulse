import { Trash2 } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import { TEAM_ROLES } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';

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

interface MemberListItemProps {
  member: TeamMember;
  onUpdateRole: (memberId: string, role: string) => void;
  onRemoveMember: (memberId: string) => void;
  avatarUrl: string | null;
}

const MemberListItem = ({ member, onUpdateRole, onRemoveMember, avatarUrl }: MemberListItemProps) => {
  const { user } = useAuth();
  
  const finalAvatarUrl = (member.user_id === user?.id ? user?.user_metadata?.avatar_url : null) ||
    avatarUrl || 
    member.profiles?.avatar_url;

  return (
    <div 
      className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 hover:border-primary/50 dark:hover:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-4">
         {/* Avatar */}
         <div className="relative">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
              <img 
                src={finalAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-label={member.status}></div>
         </div>

         {/* Identity */}
         <div>
            <div className="flex items-center gap-2">
               <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                 {member.profiles?.full_name || member.email.split('@')[0]}
               </h4>
               {member.role === 'Admin' && (
                 <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                   Admin
                 </span>
               )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{member.email}</p>
         </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
         <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
               <span className={`text-[10px] uppercase font-bold tracking-wider ${member.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                 {member.status}
               </span>
            </div>
            {/* Role Selector */}
            {/* <div className="w-32">
               <SearchableSelect
                  options={TEAM_ROLES.map(r => ({ value: r, label: r }))}
                  value={member.role}
                  onChange={(role) => onUpdateRole(member.id, role)}
                  className="h-8 text-xs"
               />
            </div> */}
         </div>

        {member.role !== 'Admin' && ( 
         <button 
            onClick={() => onRemoveMember(member.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Remove Member"
         >
            <Trash2 size={16} />
         </button>
        )}
      </div>
    </div>

  );
};


export default MemberListItem;
