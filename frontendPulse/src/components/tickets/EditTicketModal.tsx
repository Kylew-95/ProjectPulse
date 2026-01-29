import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import SearchableSelect from '../ui/SearchableSelect';
import type { Ticket } from '../../types/ticket';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  discord_id: string | null;
}


interface EditTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onTicketUpdated: () => void;
  userTeams: { id: string; name: string }[];
}

const EditTicketModal = ({ ticket, onClose, onTicketUpdated, userTeams }: EditTicketModalProps) => {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(ticket.team_id || '');
  const [autoAssign, setAutoAssign] = useState(false);
  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description || '',
    priority: ticket.priority,
    status: ticket.status,
    assignee_id: ticket.assignee_id || '',
    urgency_score: ticket.urgency_score || 0
  });

  useEffect(() => {
    if (autoAssign && selectedTeamId) {
      handleAutoAssign(selectedTeamId);
    }
  }, [selectedTeamId, autoAssign]);

  const handleAutoAssign = async (tId: string) => {
    if (!tId) return;
    setLoading(true);
    try {
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', tId);
      
      if (membersError) throw membersError;
      if (!members || members.length === 0) return;

      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('assignee_id')
        .eq('team_id', tId)
        .neq('status', 'done');
      
      if (ticketsError) throw ticketsError;

      const workload: Record<string, number> = {};
      members.forEach(m => workload[m.user_id] = 0);
      tickets?.forEach(t => {
        if (t.assignee_id && workload[t.assignee_id] !== undefined) {
          workload[t.assignee_id]++;
        }
      });

      let leastBusyId = members[0].user_id;
      let minTickets = workload[leastBusyId];

      Object.entries(workload).forEach(([uid, count]) => {
        if (count < minTickets) {
          minTickets = count;
          leastBusyId = uid;
        }
      });

      setFormData(prev => ({ ...prev, assignee_id: leastBusyId }));
    } catch (err) {
      console.error('Error auto-assigning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, email, discord_id');
      if (data) setProfiles(data);
    };
    fetchProfiles();
  }, []);

// ...

                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.discord_id || p.email?.split('@')[0] || 'User'}
                  </option>
                ))}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          assignee_id: formData.assignee_id === '' ? null : formData.assignee_id,
          team_id: selectedTeamId,
          urgency_score: formData.urgency_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (error) throw error;
      onTicketUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating ticket:', err);
      alert(`Error updating ticket: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold text-white">Edit Ticket</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
              <SearchableSelect
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' }
                ]}
                value={formData.priority}
                onChange={val => setFormData({ ...formData, priority: val })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
              <SearchableSelect
                options={[
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'done', label: 'Done' }
                ]}
                value={formData.status}
                onChange={val => setFormData({ ...formData, status: val })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Team</label>
              <SearchableSelect
                options={userTeams.map(t => ({ value: t.id, label: t.name }))}
                value={selectedTeamId}
                onChange={val => setSelectedTeamId(val)}
                placeholder="Select team..."
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 mb-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={autoAssign}
                  onChange={(e) => setAutoAssign(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-slate-950/50 text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">Auto-assign</span>
              </label>
            </div>
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
              disabled={loading}
              className="px-8 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTicketModal;
