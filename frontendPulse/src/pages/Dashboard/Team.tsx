import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Shield, MoreVertical, UserPlus } from 'lucide-react';

interface TeamMember {
    id: string;
    user_id: string;
    role: string;
    created_at: string;
    status?: string;
    profiles?: {
        full_name: string;
        email: string;
        avatar_url: string;
    }
}

const Team = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncAndFetchTeam = async () => {
        if (!user) return;
        console.log('DEBUG: Starting team sync for user:', user.id);
        try {
            // 1. Check if user exists in team_members
            const { data: existing, error: checkError } = await supabase
                .from('team_members')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle(); // Use maybeSingle to avoid 406 error if multiple or 0

            if (checkError) console.error('DEBUG: Error checking existence:', checkError);
            console.log('DEBUG: Existing member check:', existing);

            if (!existing) {
                console.log('DEBUG: User not in team, inserting...');
                // Insert if not exists
                const { error: insertError } = await supabase.from('team_members').insert({
                    user_id: user.id,
                    role: 'Admin',
                });
                if (insertError) console.error('DEBUG: Error inserting member:', insertError);
            }

            // 2. Fetch all team members
            const { data: teamData, error: teamError } = await supabase
                .from('team_members')
                .select('*');
            
            console.log('DEBUG: Team data fetched:', teamData);
            if (teamError) {
                console.error('DEBUG: Error fetching team:', teamError);
                throw teamError;
            }

            // 3. Fetch profiles for these users
            const userIds = teamData?.map(m => m.user_id) || [];
            console.log('DEBUG: Fetching profiles for IDs:', userIds);
            
            if (userIds.length > 0) {
                 const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, avatar_url, subscription_tier')
                    .in('id', userIds);
                
                console.log('DEBUG: Profiles fetched:', profilesData);
                if (profilesError) throw profilesError;

                // Merge
                const merged = teamData?.map(member => {
                    const profile = profilesData?.find(p => p.id === member.user_id);
                    return { ...member, profiles: profile };
                });
                setMembers(merged || []);
            } else {
                setMembers([]);
            }

        } catch (err) {
            console.error('Error syncing team:', err);
             // Optionally set error state to show in UI
        } finally {
            setLoading(false);
        }
    };

    syncAndFetchTeam();
  }, [user]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Team Members</h1>
          <p className="text-slate-400 mt-2">Manage your team and permissions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-lg shadow-primary/20">
          <UserPlus size={18} /> Invite Member
        </button>
      </div>

      <div className="bg-surface border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 text-slate-400 text-xs uppercase font-medium border-b border-slate-800">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading team...</td></tr>
            ) : members.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No team members found.</td></tr>
            ) : (
                members.map((member) => {
                    const profile = member.profiles || { full_name: 'Unknown', email: 'No Email', avatar_url: '' };
                    return (
                    <tr key={member.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600 flex items-center justify-center">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-bold">{profile.email?.[0]?.toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{profile.full_name || profile.email?.split('@')[0]}</div>
                                    <div className="text-xs text-slate-500">{profile.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                member.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                                {member.role === 'Admin' && <Shield size={10} />} {member.role}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                            {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500">
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <MoreVertical size={16} />
                            </button>
                        </td>
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

export default Team;
