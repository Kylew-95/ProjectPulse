import { useState } from 'react';
import { X, Loader2, Users } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface CreateTeamModalProps {
  onClose: () => void;
  onTeamCreated: (teamId: string) => void;
}

const CreateTeamModal = ({ onClose, onTeamCreated }: CreateTeamModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

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
          role: 'Admin',
          status: 'active'
        }]);

      if (memberError) throw memberError;

      onTeamCreated(team.id);
      onClose();
    } catch (err: any) {
      console.error('Error creating team:', err);
      alert(`Failed to create team: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg">
                <Users size={20} className="text-primary" />
             </div>
             <h2 className="text-xl font-bold text-white">Create New Team</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Team Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-600"
              placeholder="e.g., Engineering, Marketing, Operations"
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-8 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
