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
}

const TeamHeader = ({
  viewMode,
  selectedTeamName,
  onExport,
  onRefresh,
  loading,
  onCreateTeam,
  onInvite
}: TeamHeaderProps) => {
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
