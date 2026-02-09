import { useState } from 'react';
import { X, Loader2, Users } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';


interface CreateTeamModalProps {
  onClose: () => void;
  onTeamCreated: (teamId: string) => void;
  currentTeamCount: number;
  subscriptionTier: string;
}

const SUBSCRIPTION_LIMITS = {
  starter: { teams: 1 },
  pro: { teams: 5 },
  enterprise: { teams: Infinity },
  super_admin: { teams: Infinity },
};

type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS;

const CreateTeamModal = ({ onClose, onTeamCreated, currentTeamCount, subscriptionTier }: CreateTeamModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const tier = (subscriptionTier?.toLowerCase() || 'starter') as SubscriptionTier;
  const limit = SUBSCRIPTION_LIMITS[tier]?.teams || 1;
  const isLimitReached = currentTeamCount >= limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // 1. Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([{ name, owner_id: user.id }])
        .select()
        .single();

      if (teamError) throw teamError;

      // 2. Add creator as Admin
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
          team_id: team.id,
          user_id: user.id,
          email: user.email,
          role: 'Admin',
          status: 'active'
        }]);

      if (memberError) throw memberError;

      onTeamCreated(team.id);
      onClose();
    } catch (err: unknown) {
      console.error('Error creating team:', err);
      // Log full error details for debugging
      if (err && typeof err === 'object') {
        console.error('Error details:', JSON.stringify(err, null, 2));
      }
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to create team: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-primary/10 rounded-xl">
                <Users size={20} className="text-primary" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Team</h2>
                <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-white/5">
                        {currentTeamCount} / {limit === Infinity ? '∞' : limit} TEAMS USED
                    </span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">Team Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                placeholder="e.g., Engineering, Marketing, Operations"
                autoFocus
                disabled={isLimitReached}
              />
            </div>

            {isLimitReached && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[13px] text-red-600 dark:text-red-400 font-medium leading-relaxed">
                You have reached the maximum number of teams for your plan ({limit}). Please upgrade to create more teams.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || isLimitReached}
                className="px-8 py-3 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creating...' : isLimitReached ? 'Limit Reached' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;
