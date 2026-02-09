import { Download, UserPlus, Users, Clock } from 'lucide-react';
import PageHeader from '../common/PageHeader';

interface TeamHeaderProps {
  viewMode: 'teams' | 'members';
  selectedTeamName?: string;
  onExport: () => void;
  onRefresh: () => void;
  loading: boolean;
  onCreateTeam: () => void;
  onInvite: () => void;
  currentTeamCount?: number;
  subscriptionTier?: string;
}

const SUBSCRIPTION_LIMITS = {
  starter: { teams: 1, members: 5 },
  pro: { teams: 5, members: 20 },
  enterprise: { teams: Infinity, members: Infinity },
  super_admin: { teams: Infinity, members: Infinity },
};

const TeamHeader = ({
  viewMode,
  selectedTeamName,
  onExport,
  onRefresh,
  loading,
  onCreateTeam,
  onInvite,
  currentTeamCount = 0,
  subscriptionTier = 'starter'
}: TeamHeaderProps) => {
  const tier = (subscriptionTier?.toLowerCase() || 'starter') as keyof typeof SUBSCRIPTION_LIMITS;
  const limits = SUBSCRIPTION_LIMITS[tier];
  const teamLimit = limits?.teams || 1;

  const getTitle = () => {
      if (viewMode === 'teams') return 'Teams';
      return selectedTeamName || 'Team Details';
  };

  const getDescription = () => {
      if (viewMode === 'teams') return 'Discover and manage your collaborative workspaces.';
      return 'Review team performance and manage member permissions.';
  };

  return (
    <PageHeader 
        title={getTitle()}
        description={getDescription()}
    >
        <button 
            onClick={onRefresh}
            className="p-2.5 bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 rounded-lg transition-all border border-slate-200 dark:border-white/5 active:scale-95 group shadow-sm"
            aria-label="Refresh data"
        >
            <Clock size={18} aria-hidden="true" className={`${loading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />
        </button>
        <button 
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 rounded-lg transition-all text-sm font-medium border border-slate-200 dark:border-white/5 shadow-sm"
        >
            <Download size={16} aria-hidden="true" /> 
            <span className="hidden md:inline">Export</span>
        </button>
        
        {viewMode === 'teams' && (
        <button 
            onClick={onCreateTeam}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium shadow-sm"
        >
            <Users size={18} aria-hidden="true" /> 
            <span>Create Team</span>
        </button>
        )}
        
        {viewMode === 'teams' && (
             <div className="hidden md:flex flex-col items-end justify-center mr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {currentTeamCount} / {teamLimit === Infinity ? '∞' : teamLimit} TEAMS
                </span>
                <div className="w-24 h-1 bg-slate-100 dark:bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${currentTeamCount >= teamLimit ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${Math.min((currentTeamCount / (teamLimit === Infinity ? 100 : teamLimit)) * 100, 100)}%` }}
                    />
                </div>
             </div>
        )}

        {viewMode === 'members' && (
        <button 
            onClick={onInvite}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium shadow-sm disabled:opacity-50"
        >
            <UserPlus size={18} aria-hidden="true" /> 
            <span>Invite Member</span>
        </button>
        )}
    </PageHeader>
  );
};

export default TeamHeader;
