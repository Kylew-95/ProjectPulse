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

interface TeamResponse {
  id: string;
  name: string;
  members: {
    id: string;
    user_id: string;
    profiles: {
      avatar_url: string | null;
    } | null;
  }[];
}

interface MemberResponse {
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
    discord_status: string | null; // Added discord_status to match query
  } | null;
}

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  discord_status?: string | null;
}

const Team = () => {
  const { user, profile } = useAuth();
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);

  /* Hooks must be called before any early returns */
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
                // Step 1: Get all team IDs the current user belongs to
                const { data: userTeams, error: userTeamsError } = await supabase
                    .from('team_members')
                    .select('team_id')
                    .eq('user_id', user.id);

                if (userTeamsError) throw userTeamsError;

                const teamIds = userTeams.map(ut => ut.team_id);

                if (teamIds.length === 0) {
                    setTeams([]);
                    setLoading(false);
                    return;
                }

                // Step 2: Fetch full team details for those IDs (WITHOUT profiles embedding)
                const { data: teamsData, error: teamsError } = await supabase
                    .from('teams')
                    .select(`
                        id, 
                        name, 
                        members:team_members(
                            id,
                            user_id
                        )
                    `)
                    .in('id', teamIds);

                if (teamsError) throw teamsError;

                const typedTeamsData = teamsData as unknown as TeamResponse[];

                // Step 3: Extract all unique user IDs to fetch profiles
                const allUserIds = Array.from(new Set(
                    typedTeamsData.flatMap(t => t.members.map(m => m.user_id))
                ));

                // Step 4: Fetch profiles
                const profilesMap: Record<string, ProfileData> = {};
                if (allUserIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, email')
                        .in('id', allUserIds);
                    
                    if (profilesError) throw profilesError;

                    const typedProfilesData = profilesData as unknown as ProfileData[];
                    typedProfilesData.forEach((p) => {
                        profilesMap[p.id] = p;
                    });
                }

                const formattedTeams = typedTeamsData.map((t) => ({
                    id: t.id,
                    name: t.name,
                    members: t.members.map((m) => ({
                        id: m.id,
                        user_id: m.user_id,
                        avatar_url: profilesMap[m.user_id]?.avatar_url || null
                    }))
                }));

                setTeams(formattedTeams);
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

                // Step 1: Fetch team members (WITHOUT embedded profiles)
                const { data: membersData, error: membersError } = await supabase
                    .from('team_members')
                    .select(`
                        id,
                        user_id,
                        email,
                        discord_id,
                        role,
                        status
                    `)
                    .eq('team_id', teamId);

                if (membersError) throw membersError;

                const typedMembersData = membersData as unknown as MemberResponse[];

                // Step 2: Fetch profiles for these members
                const userIds = typedMembersData.map(m => m.user_id);
                const profilesMap: Record<string, ProfileData> = {};

                if (userIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, email, discord_status')
                        .in('id', userIds);

                    if (profilesError) throw profilesError;
                    
                    const typedProfilesData = profilesData as unknown as ProfileData[];
                    typedProfilesData.forEach((p) => {
                        profilesMap[p.id] = p;
                    });
                }

                const formattedMembers = typedMembersData.map((m) => {
                    const profile = profilesMap[m.user_id];
                    return {
                        id: m.id,
                        user_id: m.user_id,
                        email: m.email,
                        discord_id: m.discord_id,
                        role: m.role,
                        status: m.status,
                        profiles: profile ? {
                            full_name: profile.full_name,
                            avatar_url: profile.avatar_url,
                            email: profile.email,
                            discord_status: profile.discord_status
                        } : null,
                        avatar_url: profile?.avatar_url
                    };
                });

                setMembers(formattedMembers);
            }
        } catch (err: unknown) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user, viewMode, teamId, refreshTrigger, selectedTeam]);

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
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('team_members').update({ role: newRole }).eq('id', memberId);
      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
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
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
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
          onTeamCreated={async () => {
            setIsCreateTeamModalOpen(false);
            // Small delay to ensure DB write completes
            await new Promise(resolve => setTimeout(resolve, 500));
            refreshData();
          }}
          currentTeamCount={teams.length}
          subscriptionTier={profile?.subscription_tier || 'starter'}
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
        currentMemberCount={members.length}
        subscriptionTier={profile?.subscription_tier || 'starter'}
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
