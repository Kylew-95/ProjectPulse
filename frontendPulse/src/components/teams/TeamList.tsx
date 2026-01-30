import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ResourceCard from '../common/ResourceCard';
import MemberListItem from './MemberListItem';

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
  onUpdateRole,
  onRemoveMember,
  onDeleteTeam,
}: TeamListProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const rows = useMemo(() => members.map(m => ({ original: m, id: m.id })), [members]);


    
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
                <div className="flex -space-x-2 mb-6 min-h-[32px]">
                   {(team.members || []).slice(0, 2).map((member) => {
                     const avatarUrl = (member.user_id === user?.id ? user?.user_metadata?.avatar_url : null) || 
                        member.avatar_url || 
                        member.profiles?.avatar_url;
                     
                     console.log('🖼️ Avatar Debug:', {
                       user_id: member.user_id,
                       raw: member.avatar_url,
                       profile: member.profiles?.avatar_url,
                       metadata: member.user_id === user?.id ? user?.user_metadata?.avatar_url : 'N/A',
                       final: avatarUrl
                     });
                     
                     return (
                       <div key={member.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                         <img 
                           src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`} 
                           alt="Member"
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             console.error('❌ Image failed to load:', avatarUrl);
                             e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`;
                           }}
                         />
                       </div>
                     );
                   })}
                   {(team.members?.length || 0) > 2 && (
                     <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                       +{(team.members?.length || 0) - 2}
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

  // Members View (Table)
  // Members View (List Layout)
  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5">
           <Users size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
           <p className="text-slate-500 text-sm font-medium">No members found in this team.</p>
        </div>
      ) : (
        rows.map(row => (
          <MemberListItem
            key={row.id}
            member={row.original}
            onUpdateRole={onUpdateRole}
            onRemoveMember={onRemoveMember}
            avatarUrl={(row.original.user_id === user?.id ? user?.user_metadata?.avatar_url : null) || row.original.avatar_url || row.original.profiles?.avatar_url || null}
          />
        ))
      )}
    </div>
  );
};

export default TeamList;
