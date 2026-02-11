import { useQuery as useQueryReact, useMutation as useMutationReact } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GET_TEAMS_FOR_USER,
  GET_TEAM_MEMBERS,
  UPDATE_MEMBER_ROLE,
  DELETE_MEMBER,
  DELETE_TEAM
} from '../../graphql/operations';
import PermissionsModal from '../../components/teams/PermissionsModal';
import TeamHeader from '../../components/teams/TeamHeader';
import TeamList from '../../components/teams/TeamList';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import CreateTeamModal from '../../components/teams/CreateTeamModal';
import InviteModal from '../../components/teams/InviteModal';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { exportToCSV } from '../../utils/exportUtils';
// removed Loader2

interface MemberProfile {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  discord_status: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  discord_id: string | null;
  role: string;
  status: string;
  profiles: MemberProfile | null;
  avatar_url?: string | null;
}

interface Team {
  id: string;
  name: string;
  members: {
    id: string;
    user_id: string;
    avatar_url: string | null;
    full_name: string | null;
  }[];
}

interface GetTeamsForUserData {
  team_membersCollection: {
    edges: {
      node: {
        teams: {
          id: string;
          name: string;
          team_membersCollection: {
            edges: {
              node: {
                id: string;
                user_id: string;
                profiles: {
                  full_name: string | null;
                  avatar_url: string | null;
                } | null;
              };
            }[];
          };
        };
      };
    }[];
  };
}

interface GetTeamMembersData {
  teamsCollection: {
    edges: {
      node: {
        id: string;
        name: string;
        team_membersCollection: {
          edges: {
            node: TeamMember;
          }[];
        };
      };
    }[];
  };
}

const Team = () => {
    const { user, profile } = useAuth();
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [inviteIdentifier, setInviteIdentifier] = useState('');
    const [inviteRole, setInviteRole] = useState('Developer');
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

    const refreshData = () => {
      refetchTeams();
      refetchMembers();
    };

    const viewMode = teamId ? 'members' : 'teams';

  // GraphQL Hooks
  const { data: teamsData, loading: teamsLoading, error: teamsError, refetch: refetchTeams } = useQueryReact<GetTeamsForUserData>(GET_TEAMS_FOR_USER, {
    variables: { userId: user?.id },
    skip: viewMode !== 'teams' || !user?.id,
  });

  const { data: membersData, loading: membersLoading, error: membersError, refetch: refetchMembers } = useQueryReact<GetTeamMembersData>(GET_TEAM_MEMBERS, {
    variables: { teamId },
    skip: viewMode !== 'members' || !teamId,
  });

  const [updateMemberRoleMutation] = useMutationReact(UPDATE_MEMBER_ROLE);
  const [deleteMemberMutation] = useMutationReact(DELETE_MEMBER);
  const [deleteTeamMutation] = useMutationReact(DELETE_TEAM);

  useEffect(() => {
    console.log('DEBUG: Teams Query:', { teamsData, teamsLoading, teamsError, userId: user?.id });
    if (viewMode === 'teams' && teamsData?.team_membersCollection) {
      const formattedTeams = teamsData.team_membersCollection.edges.map(edge => {
        const team = edge.node.teams;
        if (!team) return null;
        
        return {
          id: team.id,
          name: team.name,
          members: team.team_membersCollection.edges.map(mEdge => ({
            id: mEdge.node.id,
            user_id: mEdge.node.user_id,
            avatar_url: mEdge.node.profiles?.avatar_url || null,
            full_name: mEdge.node.profiles?.full_name || null
          }))
        };
      }).filter(Boolean) as Team[];
      setTeams(formattedTeams);
      setLoading(false);
    } else if (viewMode === 'members' && membersData?.teamsCollection) {
      if (membersData.teamsCollection.edges.length > 0) {
        const teamData = membersData.teamsCollection.edges[0].node;
        setSelectedTeam({ id: teamData.id, name: teamData.name });
        
        const formattedMembers = teamData.team_membersCollection.edges.map(edge => ({
          ...edge.node,
          avatar_url: edge.node.profiles?.avatar_url,
        }));
        setMembers(formattedMembers);
      }
      setLoading(false);
    }
    
    // Sync local loading state with network loading
    if ((viewMode === 'teams' && !teamsLoading) || (viewMode === 'members' && !membersLoading)) {
        setLoading(false);
    }
    
    if (teamsError || membersError) {
        console.error('Teams/Members Query Error:', teamsError || membersError);
        setLoading(false);
    }

  }, [teamsData, membersData, viewMode, teamsLoading, membersLoading, teamsError, membersError, user?.id]);

  const handleInviteSuccess = () => {
    setIsInviteModalOpen(false);
    setInviteIdentifier('');
    refreshData();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;
    setLoading(true);
    try {
      const isEmail = inviteIdentifier.includes('@');
      const payload = {
          email: isEmail ? inviteIdentifier : null,
          discord_id: isEmail ? null : inviteIdentifier,
          role: inviteRole,
          team_id: teamId
      };

      // Call our new Backend SMTP + Discord Invitation Service
      const response = await fetch(`${import.meta.env.VITE_API_URL}/general/send-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to send invitation');
      }

      handleInviteSuccess();
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRoleMutation({
        variables: { id: memberId, set: { role: newRole } }
      });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    // Only Team Lead or Admin can remove members
    const userRoleInTeam = members.find(m => m.user_id === user?.id)?.role;
    const isLead = userRoleInTeam === 'Team Lead' || profile?.subscription_tier === 'super_admin';

    if (!isLead) {
        alert("Permission denied. Only Team Leads or Admins can remove members.");
        return;
    }

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
        await deleteMemberMutation({ variables: { id: deleteModal.id } });
        setMembers(prev => prev.filter(m => m.id !== deleteModal.id));
      } else {
        await deleteTeamMutation({ variables: { id: deleteModal.id } });
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
        currentTeamCount={teams.length}
        subscriptionTier={profile?.subscription_tier || 'starter'}
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
