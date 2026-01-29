import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { 
  Shield, 
  MoreVertical, 
  UserPlus, 
  Search, 
  Download, 
  ChevronDown, 
  Users,
  ExternalLink,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Check,
  Clock,
  Mail,
  Calendar
} from 'lucide-react';
import ProGate from '../../components/ui/ProGate';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import FilterDropdown from '../../components/ui/FilterDropdown';
import { exportToCSV } from '../../utils/exportUtils';

interface TeamMember {
    id: string;
    user_id: string;
    role: string;
    created_at: string;
    status: string;
    email?: string;
    discord_id?: string;
    profiles?: {
        full_name: string;
        email: string;
        avatar_url: string;
        discord_id?: string;
    }
}

const Team = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<{ id: string } | null>(null);
  const [inviteIdentifier, setInviteIdentifier] = useState(''); // Email or Discord ID
  const [inviteRole, setInviteRole] = useState('Member');

  // Real Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const syncAndFetchTeam = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Ensure user is in team
            const { data: existing } = await supabase
                .from('team_members')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!existing) {
                // If no team member record, and we are user, let's create a default team or join one
                const { data: teamsOwned } = await supabase.from('teams').select('id').eq('owner_id', user.id).maybeSingle();
                let teamId = teamsOwned?.id;

                if (!teamId) {
                    const { data: newTeam, error: createError } = await supabase.from('teams').insert({
                        name: `${user.user_metadata?.name || 'Personal'}'s Team`,
                        owner_id: user.id
                    }).select().single();
                    if (!createError) teamId = newTeam.id;
                }

                if (teamId) {
                    await supabase.from('team_members').insert({
                        team_id: teamId,
                        user_id: user.id,
                        role: 'Admin',
                    });
                }
            }

            // Get current team context
            const { data: memberRecord } = await supabase.from('team_members').select('team_id').eq('user_id', user.id).maybeSingle();
            if (memberRecord) setCurrentTeam({ id: memberRecord.team_id });

            // 2. Fetch total count with filters
            let countQuery = supabase
                .from('team_members')
                .select('*', { count: 'exact', head: true });
            
            if (roleFilter !== 'all') countQuery = countQuery.eq('role', roleFilter);
            
            const { count: total } = await countQuery;
            setTotalCount(total || 0);

            // 3. Fetch paginated members
            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;

            let dataQuery = supabase
                .from('team_members')
                .select('*');
            
            if (roleFilter !== 'all') dataQuery = dataQuery.eq('role', roleFilter);

            const { data: teamData, error: teamError } = await dataQuery
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (teamError) throw teamError;

            // 4. Fetch profiles for these users
            const userIds = teamData?.map(m => m.user_id) || [];
            
            if (userIds.length > 0) {
                 let profilesQuery = supabase
                    .from('profiles')
                    .select('id, full_name, email, avatar_url, subscription_tier, discord_id');
                
                if (searchQuery) {
                    profilesQuery = profilesQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
                }

                const { data: profilesData, error: profilesError } = await profilesQuery.in('id', userIds);
                
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
        } finally {
            setLoading(false);
        }
    };

    syncAndFetchTeam();
  }, [user, currentPage, roleFilter, searchQuery]); // Re-fetch on filter change

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam || !inviteIdentifier) {
        alert('Missing team context or identifier');
        return;
    }
    
    setLoading(true);
    try {
      const isDiscord = !inviteIdentifier.includes('@');
      
      const { error } = await supabase.from('team_members').insert({
        team_id: currentTeam.id,
        [isDiscord ? 'discord_id' : 'email']: inviteIdentifier,
        role: inviteRole,
        status: 'invited'
      });

      if (error) throw error;
      
      setIsInviteModalOpen(false);
      setInviteIdentifier('');
      // Trigger re-fetch
      setCurrentPage(1);
      alert('Invitation sent successfully!');
    } catch (err: any) {
      console.error('Error inviting member:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const handleExport = () => {
    const exportData = members.map(m => ({
      Name: m.profiles?.full_name || 'Unknown',
      Email: m.profiles?.email || m.email || 'No Email',
      Discord: m.profiles?.discord_id || m.discord_id || 'None',
      Role: m.role,
      Status: m.status || 'Active',
      Joined: new Date(m.created_at).toLocaleDateString()
    }));
    exportToCSV(exportData, `team-export-${new Date().toISOString().split('T')[0]}`);
  };

  const currentMembers = members; // Already paginated from server
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen font-sans selection:bg-primary/30">
      <Breadcrumbs />

      {/* Header Section */}
      <div className="flex justify-between items-end mb-8 px-2">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">People</h1>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-all text-sm font-medium border border-white/5"
            >
                <Download size={14} /> 
                <span className="hidden md:inline">Export team</span>
                <ChevronDown size={14} />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg transition-all text-sm font-medium border border-white/5 md:hidden">
              <UserPlus size={16} />
            </button>
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-all font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus size={18} strokeWidth={3} /> Invite
            </button>
        </div>
      </div>

      <ProGate featureName="Team Management" description="Collaborate with your team, assign roles, and manage permissions. Upgrade to Pro to unlock Team features.">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          {/* Stylized Filter Bar */}
          <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3 bg-white/5">
            <div className="relative group flex-1 max-w-xs min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search by name, email or discord..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            <FilterDropdown 
                label="Role" 
                options={[
                    { id: 'all', label: 'All Roles' },
                    { id: 'Admin', label: 'Admin', icon: <Shield size={14} /> },
                    { id: 'Member', label: 'Member', icon: <Users size={14} /> },
                ]} 
                selectedId={roleFilter} 
                onSelect={setRoleFilter} 
            />

            <FilterDropdown 
                label="Status" 
                options={[
                    { id: 'all', label: 'All Statuses' },
                    { id: 'active', label: 'Active', icon: <UserCheck size={14} className="text-emerald-400" /> },
                    { id: 'inactive', label: 'Inactive', icon: <UserX size={14} className="text-slate-500" /> },
                ]} 
                selectedId={statusFilter} 
                onSelect={setStatusFilter} 
            />
            
            <div className="h-6 w-px bg-white/10 mx-1 hidden lg:block"></div>

            <button 
              onClick={() => setIsPermissionsModalOpen(true)}
              className="ml-auto hidden lg:flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Manage permissions <ExternalLink size={14} className="opacity-50" />
            </button>
          </div>

          {/* Professional Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-white/5">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 w-64">Contact</th>
                  <th className="px-6 py-4 w-32">Role</th>
                  <th className="px-6 py-4 w-40">Status</th>
                  <th className="px-6 py-4 w-40">Joined</th>
                  <th className="px-6 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <span className="text-slate-500 text-sm font-medium">Loading team...</span>
                        </div>
                    </td>
                  </tr>
                ) : currentMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                        <div className="max-w-xs mx-auto text-slate-500">
                            <Users className="mx-auto mb-4 opacity-10" size={48} />
                            <p className="font-bold text-slate-400 mb-1">No members found</p>
                            <p className="text-xs">Try adjusting your search or invite a new teammate.</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  currentMembers.map((member) => {
                    const profile = member.profiles || { full_name: 'Unknown', email: 'No Email', avatar_url: '' };
                    return (
                      <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-bold text-white overflow-hidden uppercase bg-gradient-to-br from-indigo-500 to-purple-600">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{profile.full_name?.[0] || profile.email?.[0] || 'U'}</span>
                                )}
                            </div>
                            <span className="text-sm font-medium text-slate-200">
                                {profile.full_name || profile.email?.split('@')[0]}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2 text-slate-400 text-xs">
                                <Mail size={12} className="opacity-50" />
                                {profile.email || member.email || 'No email linked'}
                             </div>
                             {(profile.discord_id || member.discord_id) && (
                               <div className="flex items-center gap-2 text-primary/70 text-[10px] font-bold">
                                  <Users size={12} className="opacity-50" />
                                  {profile.discord_id || member.discord_id}
                               </div>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 w-fit ${getRoleColor(member.role)}`}>
                              {member.role === 'Admin' && <Shield size={10} />}
                              {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 ${member.status === 'invited' ? 'text-amber-400' : 'text-green-400'}`}>
                             {member.status === 'invited' ? <Clock size={14} /> : <UserCheck size={14} />}
                             <span className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                                {member.status || 'Active'}
                             </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-slate-500 text-xs">
                              <Calendar size={12} className="opacity-50" />
                              {new Date(member.created_at).toLocaleDateString()}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-slate-600 hover:text-white transition-colors p-2">
                              <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Real Pagination Footer */}
          <div className="p-4 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 grayscale opacity-50 cursor-pointer hover:opacity-100 transition-opacity">
                   <MoreHorizontal size={14} /> <span>Give feedback</span>
               </div>
               <span>Showing {Math.min((currentPage-1)*pageSize + 1, members.length)}-{Math.min(currentPage*pageSize, members.length)} of {members.length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                    currentPage === i + 1 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </ProGate>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleInvite}>
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Discord ID or Email</label>
                  <input 
                    type="text" 
                    required
                    value={inviteIdentifier}
                    onChange={(e) => setInviteIdentifier(e.target.value)}
                    placeholder="Discord ID (e.g. 123456) or Email"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary transition-all"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Role</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary transition-all appearance-none"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
               </div>
               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Overview Modal */}
      {isPermissionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Shield className="text-primary" />
                 <h2 className="text-xl font-bold text-white">Role Permissions</h2>
              </div>
              <button onClick={() => setIsPermissionsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                 <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
               <div className="grid grid-cols-2 gap-8">
                  <div>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-white/5 pb-2">Admin</h3>
                     <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Manage team & roles</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Delete any work item</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> View financial analytics</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Manage subscriptions</li>
                     </ul>
                  </div>
                  <div>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-white/5 pb-2">Member</h3>
                     <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Create work items</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Edit assigned items</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Comment on tasks</li>
                        <li className="flex items-center gap-2 text-slate-600 italic">No admin access</li>
                     </ul>
                  </div>
               </div>
            </div>
            <div className="p-6 bg-white/5 border-t border-white/5 text-right">
               <button onClick={() => setIsPermissionsModalOpen(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
