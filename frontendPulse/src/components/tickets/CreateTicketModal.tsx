import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import PrioritySelector, { type Priority } from '../common/PrioritySelector';
import { TagSelector, type Tag } from '../common/TagComponents';

interface CreateTicketModalProps {
  onClose: () => void;
  onTicketCreated: () => void;
  teamId: string | null;
  userTeams: { id: string; name: string }[];
}

const CreateTicketModal = ({ onClose, onTicketCreated, teamId, userTeams }: CreateTicketModalProps) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId || '');
  const [autoAssign, setAutoAssign] = useState(true);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open',
    urgency_score: 5,
    assignee_id: ''
  });

  useEffect(() => {
    if (autoAssign && selectedTeamId) {
      handleAutoAssign(selectedTeamId);
    }
  }, [selectedTeamId, autoAssign]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTags(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchTags = async (tId: string) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('team_id', tId);
      
      if (error) throw error;
      setAvailableTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const handleCreateTag = async (name: string, color: string) => {
    if (!selectedTeamId) return;
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name, color, team_id: selectedTeamId }])
        .select()
        .single();
      
      if (error) throw error;
      if (data) {
        setAvailableTags([...availableTags, data]);
        setSelectedTags([...selectedTags, data]);
      }
    } catch (err) {
      console.error('Error creating tag:', err);
    }
  };

  const handleAutoAssign = async (tId: string) => {
    if (!tId) return;
    setLoading(true);
    try {
      // 1. Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', tId);
      
      if (membersError) throw membersError;
      if (!members || members.length === 0) return;

      // 2. Fetch active ticket counts for each member
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('assignee_id')
        .eq('team_id', tId)
        .neq('status', 'done');
      
      if (ticketsError) throw ticketsError;

      // 3. Calculate workload
      const workload: Record<string, number> = {};
      members.forEach(m => workload[m.user_id] = 0);
      tickets?.forEach(t => {
        if (t.assignee_id && workload[t.assignee_id] !== undefined) {
          workload[t.assignee_id]++;
        }
      });

      // 4. Find least busy member
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedTeamId) {
        throw new Error('Please select a team.');
      }

      // Create the ticket
      const { data: newTicket, error } = await supabase.from('tickets').insert([
        {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          urgency_score: formData.urgency_score,
          reporter_id: session?.user?.id,
          team_id: selectedTeamId,
          assignee_id: formData.assignee_id || null
        }
      ]).select().single();

      if (error) throw error;

      // Add tag associations if any tags are selected
      if (newTicket && selectedTags.length > 0) {
        const tagAssociations = selectedTags.map(tag => ({
          ticket_id: newTicket.id,
          tag_id: tag.id
        }));

        const { error: tagError } = await supabase
          .from('ticket_tags')
          .insert(tagAssociations);

        if (tagError) console.error('Error adding tags:', tagError);
      }

      onTicketCreated();
      onClose();
    } catch (err: unknown) {
      console.error('Error creating ticket:', err);
      const message = err instanceof Error ? err.message : 'Failed to create ticket';
      alert(message); 
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">Create New Ticket</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
              placeholder="e.g., Update Landing Page"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
              placeholder="Describe the task..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
            <PrioritySelector 
              value={formData.priority}
              onChange={(priority: Priority) => setFormData({ ...formData, priority })}
              size="sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Team</label>
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Select a team</option>
              {userTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
            <TagSelector
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              onCreateTag={handleCreateTag}
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="autoAssign"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-black/50 text-primary focus:ring-primary"
            />
            <label htmlFor="autoAssign" className="text-sm font-medium text-slate-300 cursor-pointer">
              Auto-assign to least busy member
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
