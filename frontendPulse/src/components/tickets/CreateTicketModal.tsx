import { useState, useEffect } from 'react';
import { X, Loader2, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import PrioritySelector, { type Priority } from '../common/PrioritySelector';
import { TagSelector, type Tag } from '../common/TagComponents';

interface CreateTicketModalProps {
  onClose: () => void;
  onTicketCreated: () => void;
  teamId: string | null;
  userTeams: { id: string; name: string }[];
  initialData?: {
    title?: string;
    description?: string;
  };
}

const CreateTicketModal = ({ onClose, onTicketCreated, teamId, userTeams, initialData }: CreateTicketModalProps) => {
  const { session } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId || '');
  const [autoAssign, setAutoAssign] = useState(true);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: 'medium' as Priority,
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!selectedTeamId) throw new Error('Please select a team.');

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

  const isStep1Valid = formData.title.trim() !== '' && formData.description.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Ticket</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest mt-1">
              Step {step} of 2
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">Ticket Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                  placeholder="e.g., Fix Navigation Bug"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 resize-none"
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">Baseline Priority</label>
                <PrioritySelector 
                  value={formData.priority}
                  onChange={(priority: Priority) => setFormData({ ...formData, priority })}
                  size="sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">Assign to Team</label>
                  <select
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="">Select a team</option>
                    {userTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">Categorical Tags</label>
                <TagSelector
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  onCreateTag={handleCreateTag}
                />
              </div>

              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Auto-Assignment</div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Match with least busy member</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoAssign(!autoAssign)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${autoAssign ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${autoAssign ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={step === 1 ? () => setStep(2) : handleSubmit}
            disabled={loading || (step === 1 && !isStep1Valid) || (step === 2 && !selectedTeamId)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : step === 1 ? (
              <>
                Next
                <ChevronRight size={18} />
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Ticket
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
