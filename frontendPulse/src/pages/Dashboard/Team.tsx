import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import CreateTeamModal from '../../components/teams/CreateTeamModal';
import InviteModal from '../../components/teams/InviteModal';
import PermissionsModal from '../../components/teams/PermissionsModal';
import TeamHeader from '../../components/teams/TeamHeader';
import TeamFilters from '../../components/teams/TeamFilters';
import TeamList from '../../components/teams/TeamList';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Pagination from '../../components/common/Pagination';
import { exportToCSV } from '../../utils/exportUtils';

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

const Team = () => {
  const { user, profile } = useAuth();
  const { teamId } = useParams();
  const [members, setMembers] = useState<TeamMember[]>([]);

  // ... (keep state declarations)

  // Access Control for Teams
  if (['Free', 'Starter'].includes(profile?.subscription_tier || 'Free')) {
     return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Team Access Restricted</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
               Your current plan ({profile?.subscription_tier}) does not include access to Team Management. Upgrade to Pro or Enterprise to collaborate with your team.
            </p>
            {/* Optional: Add Upgrade Button if routing exists */}
        </div>
     );
  }

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string; members: { id: string; user_id: string; avatar_url: string | null }[] }[]>([]);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  // Real Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  
  const viewMode = teamId ? 'members' : 'teams';

  useEffect(() => {
    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (viewMode === 'teams') {
                const { data: memberRecords, error: memberError } = await supabase
                    .from('team_members')
                    .select('team_id, teams(id, name)')
                    .eq('user_id', user.id);

                if (memberError) throw memberError;

                const teamIds = memberRecords
                    ?.filter(m => m.teams)
                    .map(m => {
                        const t = m.teams as any;
                        return Array.isArray(t) ? t[0].id : t.id;
                    }) || [];


                // Fetch members for these teams separately to avoid nested query issues
                let allMembers: any[] = [];
                if (teamIds.length > 0) {
                    console.log('🔍 Fetching members for team IDs:', teamIds);
                    
                    // Fetch team_members WITHOUT the profiles join
                    const { data: membersData, error: membersError } = await supabase
                        .from('team_members')
                        .select('team_id, user_id')
                        .in('team_id', teamIds);

                    if (membersError) {
                        console.error('❌ Error fetching team members:', membersError);
                    } else if (membersData && membersData.length > 0) {
                        // Get unique user IDs
                        const userIds = [...new Set(membersData.map(m => m.user_id))];
                        
                        // Fetch profiles separately
                        const { data: profilesData, error: profilesError } = await supabase
                            .from('profiles')
                            .select('id, avatar_url')
                            .in('id', userIds);

                        if (profilesError) {
                            console.error('❌ Error fetching profiles:', profilesError);
                        }

                        // Merge members with their profiles
                        allMembers = membersData.map(member => ({
                            team_id: member.team_id,
                            user_id: member.user_id,
                            profiles: profilesData?.find(p => p.id === member.user_id) || null
                        }));
                    }
                    
                    console.log('✅ Fetched team members:', allMembers);
                }

                const userTeams = memberRecords
                    ?.filter(m => m.teams)
                    .map(m => {
                        const t = Array.isArray(m.teams) ? m.teams[0] : m.teams;
                        const teamMembers = allMembers?.filter(am => am.team_id === t.id) || [];
                        
                        console.log(`📊 Team "${t.name}" has ${teamMembers.length} members:`, teamMembers);
                        
                        return { 
                            id: t.id, 
                            name: t.name,
                            members: teamMembers.map((tm: any) => ({
                                id: tm.user_id,
                                user_id: tm.user_id,
                                avatar_url: tm.profiles?.avatar_url || null,
                                profiles: tm.profiles
                            }))
                        };
                    }) || [];
                
                console.log('🎯 Final userTeams:', userTeams);
                setTeams(userTeams);
                setTotalCount(userTeams.length);
                setMembers([]);
            } else if (viewMode === 'members' && teamId) {
                if (!selectedTeam || selectedTeam.id !== teamId) {
                  const { data: teamData, error: teamError } = await supabase
                    .from('teams')
                    .select('id, name')
                    .eq('id', teamId)
                    .single();
                  
                  if (teamError) throw teamError;
                  setSelectedTeam(teamData);
                }

                const from = (currentPage - 1) * pageSize;
                const to = from + pageSize - 1;

                // Fetch team_members WITHOUT profiles join
                let query = supabase
                    .from('team_members')
                    .select('id, user_id, email, discord_id, role, status', { count: 'exact' })
                    .eq('team_id', teamId);

                if (roleFilter !== 'all') query = query.eq('role', roleFilter);
                if (statusFilter !== 'all') query = query.eq('status', statusFilter);
                if (searchQuery) query = query.or(`email.ilike.%${searchQuery}%`);

                const { data: membersData, error, count } = await query
                    .range(from, to);

                if (error) throw error;

                // Fetch profiles separately for these members
                if (membersData && membersData.length > 0) {
                    const userIds = membersData.map(m => m.user_id).filter(Boolean);
                    
                    if (userIds.length > 0) {
                        const { data: profilesData } = await supabase
                            .from('profiles')
                            .select('id, full_name, avatar_url, email')
                            .in('id', userIds);

                        // Merge profiles into members
                        const mergedMembers = membersData.map(member => ({
                            ...member,
                            profiles: profilesData?.find(p => p.id === member.user_id) || null
                        }));

                        setMembers(mergedMembers as any);
                    } else {
                        setMembers(membersData as any);
                    }
                } else {
                    setMembers([]);
                }
                
                setTotalCount(count || 0);
            }
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user, currentPage, roleFilter, searchQuery, viewMode, teamId, refreshTrigger]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;
    setLoading(true);
    try {
      const isEmail = inviteIdentifier.includes('@');
      const { error } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamId,
          email: isEmail ? inviteIdentifier : 'pending@discord.user',
          discord_id: isEmail ? null : inviteIdentifier,
          role: inviteRole,
          status: 'inactive'
        }]);
      if (error) throw error;
      setIsInviteModalOpen(false);
      setInviteIdentifier('');
      refreshData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('team_members').update({ role: newRole }).eq('id', memberId);
      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
     if (!confirm('DANGER: This will delete the team. Are you sure?')) return;
     try {
      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setTotalCount(prev => prev - 1);
    } catch (err: any) {
      alert(`Error : ${err.message}`);
    }
  };

  const handleExport = () => {
    if (viewMode === 'members') {
      const data = members.map(m => ({
        Name: m.profiles?.full_name || 'N/A',
        Email: m.email,
        Discord: m.discord_id || 'N/A',
        Role: m.role,
        Status: m.status
      }));
      exportToCSV(data, `team-members-${selectedTeam?.name || 'export'}`);
    } else {
      const data = teams.map(t => ({ ID: t.id, Name: t.name }));
      exportToCSV(data, 'my-teams-export');
    }
  };



  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen animate-in fade-in duration-700">
      <Breadcrumbs />

      <TeamHeader 
        viewMode={viewMode}
        selectedTeamName={selectedTeam?.name}
        onExport={handleExport}
        onRefresh={refreshData}
        loading={loading}
        onCreateTeam={() => setIsCreateTeamModalOpen(true)}
        onInvite={() => setIsInviteModalOpen(true)}
      />

      <div className="space-y-8">
        {viewMode === 'members' && (
          <TeamFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            setIsPermissionsModalOpen={setIsPermissionsModalOpen}
          />
        )}

        <div className={viewMode === 'members' ? "" : "min-h-[400px]"}>
          <TeamList 
            viewMode={viewMode}
            loading={loading}
            members={members}
            teams={teams}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
            onDeleteTeam={handleDeleteTeam}
          />
        </div>

        {/* Pagination Footer - Only for members view as Teams are currently not paginated in the same way or few in number */}
        {viewMode === 'members' && totalCount > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            entityName="experts"
          />
        )}
      </div>

      {isCreateTeamModalOpen && (
        <CreateTeamModal 
          onClose={() => setIsCreateTeamModalOpen(false)}
          onTeamCreated={async (_teamId) => {
            setIsCreateTeamModalOpen(false);
            // Small delay to ensure DB write completes
            await new Promise(resolve => setTimeout(resolve, 500));
            refreshData();
            if (currentPage !== 1) setCurrentPage(1);
          }}
        />
      )}

      <InviteModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInvite}
        inviteIdentifier={inviteIdentifier}
        setInviteIdentifier={setInviteIdentifier}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        loading={loading}
      />

      <PermissionsModal 
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />
    </div>
  );
};

export default Team;
