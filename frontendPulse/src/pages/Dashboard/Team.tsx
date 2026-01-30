import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import CreateTeamModal from '../../components/teams/CreateTeamModal';
import InviteModal from '../../components/teams/InviteModal';
import PermissionsModal from '../../components/teams/PermissionsModal';
import TeamHeader from '../../components/teams/TeamHeader';
import TeamList from '../../components/teams/TeamList';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

import Breadcrumbs from '../../components/ui/Breadcrumbs';
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
  avatar_url?: string | null;
}

const Team = () => {
  const { user, profile } = useAuth();
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);

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


  // Client-side filtering implementation - simplified state
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string; members: { id: string; user_id: string; avatar_url: string | null }[] }[]>([]);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'member' | 'team';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'team',
    id: '',
    title: '',
    message: ''
  });

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  
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

                // Fetch all team_members for client-side filtering
                let query = supabase
                    .from('team_members')
                    .select('id, user_id, email, discord_id, role, status')
                    .eq('team_id', teamId);

                const { data: membersData, error } = await query;

                if (error) throw error;

                // Fetch profiles separately for these members
                if (membersData && membersData.length > 0) {
                    const userIds = membersData.map(m => m.user_id).filter(Boolean);
                    
                    if (userIds.length > 0) {
                        const { data: profilesData } = await supabase
                            .from('profiles')
                            .select('id, full_name, avatar_url, email, discord_status')
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
            }
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user, viewMode, teamId, refreshTrigger]);

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

  const handleRemoveMember = (memberId: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'member',
      id: memberId,
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member? They will lose access to this workspace immediately.'
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'team',
      id: teamId,
      title: 'Delete Team',
      message: 'DANGER: This will permanently delete the team and all associated data. This action cannot be undone.'
    });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      if (deleteModal.type === 'member') {
        const { error } = await supabase.from('team_members').delete().eq('id', deleteModal.id);
        if (error) throw error;
        setMembers(prev => prev.filter(m => m.id !== deleteModal.id));
      } else {
        const { error } = await supabase.from('teams').delete().eq('id', deleteModal.id);
        if (error) throw error;
        setTeams(prev => prev.filter(t => t.id !== deleteModal.id));
        if (teamId === deleteModal.id) {
          navigate('/dashboard/team');
        }
      }
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
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
      </div>

      {isCreateTeamModalOpen && (
        <CreateTeamModal 
          onClose={() => setIsCreateTeamModalOpen(false)}
          onTeamCreated={async (_teamId) => {
            setIsCreateTeamModalOpen(false);
            // Small delay to ensure DB write completes
            await new Promise(resolve => setTimeout(resolve, 500));
            refreshData();
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

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
        loading={loading}
      />
    </div>
  );
};

export default Team;
