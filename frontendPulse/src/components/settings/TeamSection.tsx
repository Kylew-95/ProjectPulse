import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProGate from '../ui/ProGate';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';

interface Team {
  id: string;
  name: string;
  owner_id: string;
}

interface TeamMember {
  id: string;
  email: string;
  discord_id?: string;
  role: string;
  status: string;
}

const TeamSection = () => {
  const { profile, user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDiscord, setInviteDiscord] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
  }>({
    isOpen: false,
    id: ''
  });

  const isPro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'enterprise';

  useEffect(() => {
    if (user && isPro) {
      fetchTeam();
    }
  }, [user, isPro]);

  // ... (keeping helper functions as they are, but since I am replacing logic, I need to make sure I don't delete them. 
  // Wait, I am using replace_file_content with range? 
  // No, the instruction says "Replace the manual blur/lock logic". I should be careful not to delete the functions.
  // I will just replace the render part mostly. But since ProGate wraps everything, indentation changes.
  // Let's replace the whole component's return statement block primarily, but I need to be careful with the huge replacement.
  // Actually, I can replace the whole file content to be safe and clean since I have the view.
  
  const fetchTeam = async () => {
    try {
      setLoading(true);
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      if (teamData) {
        setTeam(teamData);
        fetchMembers(teamData.id);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (teamId: string) => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);
    if (data) setMembers(data);
  };


  const handleInvite = async () => {
    if (!inviteEmail.trim() || !team) return;
    setInviting(true);
    try {
      const { error } = await supabase.from('team_members').insert({
        team_id: team.id,
        email: inviteEmail,
        discord_id: inviteDiscord || null,
        role: 'Member',
        status: 'invited'
      });
      
      if (error) throw error;
      setInviteEmail('');
      setInviteDiscord('');
      fetchMembers(team.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await supabase.from('team_members').delete().eq('id', deleteModal.id);
      if (team) fetchMembers(team.id);
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative mb-6">
       <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users className="text-primary" size={24} /> Team Management
      </h2>

      <ProGate featureName="Team Management" description="Upgrade to Pro to unlock team management, invite members, and collaborate efficiently.">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden p-6">
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            ) : !team ? (
                <div className="text-center py-8">
                    <p className="text-slate-400 mb-2">You haven't created a primary team yet. Go to the Teams page to manage your teams.</p>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{team.name}</h3>
                            <p className="text-sm text-slate-400">{members.length} Members</p>
                        </div>
                    </div>

                    {/* Invite Form */}
                    <div className="bg-slate-50 dark:bg-black/20 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-800/50">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <UserPlus size={16} /> Invite New Member
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input 
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Email Address"
                                className="bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                            />
                            <input 
                                value={inviteDiscord}
                                onChange={(e) => setInviteDiscord(e.target.value)}
                                placeholder="Discord ID (Optional)"
                                className="bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleInvite}
                                disabled={inviting}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                            >
                                {inviting ? 'Inviting...' : 'Send Invite'}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    </div>

                    {/* Members List */}
                    <div className="space-y-3">
                        {members.map(member => (
                            <div key={member.id} className="flex justify-between items-center bg-slate-50 dark:bg-black/20 p-3 rounded-lg border border-slate-200 dark:border-slate-800/50">
                                <div>
                                    <p className="text-slate-900 dark:text-white font-medium">{member.email}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className={`px-1.5 py-0.5 rounded ${member.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                            {member.role}
                                        </span>
                                        {member.discord_id && (
                                            <span>Discord: {member.discord_id}</span>
                                        )}
                                        <span className={member.status === 'active' ? 'text-green-400' : 'text-amber-400'}>
                                            {member.status}
                                        </span>
                                    </div>
                                </div>
                                {member.role !== 'Admin' && (
                                    <button 
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </ProGate>

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        title="Remove Member"
        message="Are you sure you want to remove this member? They will lose access to team resources immediately."
        loading={loading}
      />
    </section>
  );
};

export default TeamSection;
