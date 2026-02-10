import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Copy, Check, Lock, Send } from 'lucide-react';
import { useMutation as useMutationReact } from '@apollo/client/react';
import type { ExecutionResult } from 'graphql';
import { UPDATE_TICKET } from '../../graphql/operations';
import { supabase } from '../../supabaseClient';
import SearchableSelect from '../ui/SearchableSelect';
import type { Ticket } from '../../types/ticket';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CommentList from './CommentList';
import { getApiUrl } from '../../utils/apiConfig';

interface TicketProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  discord_id: string | null;
}

interface UpdateTicketData {
  updateticketsCollection: {
    records: { id: string; title: string }[];
  };
}


interface EditTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onTicketUpdated: () => void;
  userTeams: { id: string; name: string }[];
}

const EditTicketModal = ({ ticket, onClose, onTicketUpdated, userTeams }: EditTicketModalProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [editableReply, setEditableReply] = useState<string>('');
  const [sendLoading, setSendLoading] = useState(false);
  const [updateTicketMutation] = useMutationReact<UpdateTicketData>(UPDATE_TICKET);
  const [copied, setCopied] = useState(false);
  const [profiles, setProfiles] = useState<TicketProfile[]>([]);
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

  const isEnterprise = ['enterprise', 'super_admin'].includes(profile?.subscription_tier || '');

  const handleSuggestReply = async () => {
    if (!isEnterprise) {
        navigate('/pricing');
        return;
    }
    if (!user) return;
    setSuggestionLoading(true);
    setSuggestion(null);
    try {
      const response = await fetch(`${getApiUrl()}/intelligence/suggest-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket.id, user_id: user.id })
      });
      if (response.status === 403) {
          setSuggestion('This feature requires an Enterprise subscription.');
          return;
      }
      const result = await response.json();
      setSuggestion(result.suggestion);
      setEditableReply(result.suggestion);
    } catch (error) {
      console.error('Error fetching suggestion:', error);
      setSuggestion('Could not generate suggestion at this time.');
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleSendToDiscord = async () => {
    if (!user || !editableReply) return;
    setSendLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/intelligence/send-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticket_id: ticket.id, 
          user_id: user.id,
          message: editableReply
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to send reply');
      }

      alert('Reply sent to Discord!');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert(error instanceof Error ? error.message : 'Error sending reply');
    } finally {
      setSendLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!editableReply) return;
    navigator.clipboard.writeText(editableReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      // Fetch via team_members to ensure we only get relevant users and respect team boundaries
      const { data } = await supabase
        .from('team_members')
        .select(`
          profiles (
            id,
            full_name,
            avatar_url,
            email,
            discord_id
          )
        `);
      
      if (data) {
        // Extract profiles and remove duplicates
        const uniqueProfilesMap = new Map();
        data.forEach((item: { profiles: TicketProfile | TicketProfile[] | null }) => {
          if (item.profiles) {
            // Handle array or single object return from join
            const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
            if (profile && !uniqueProfilesMap.has(profile.id)) {
              uniqueProfilesMap.set(profile.id, profile);
            }
          }
        });
        setProfiles(Array.from(uniqueProfilesMap.values()));
      }
    };
    fetchProfiles();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result: ExecutionResult<UpdateTicketData> = await updateTicketMutation({
        variables: {
          id: ticket.id,
          set: {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            status: formData.status,
            assignee_id: formData.assignee_id === '' ? null : formData.assignee_id,
            team_id: selectedTeamId,
            urgency_score: formData.urgency_score,
            updated_at: new Date().toISOString()
          }
        }
      });

      if (result.errors) throw new Error(result.errors[0].message);
      onTicketUpdated();
      onClose();
    } catch (err: unknown) {
      console.error('Error updating ticket:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error updating ticket: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-white/5 shrink-0">
          <h2 className="text-xl font-bold text-white">Edit Ticket</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
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

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">AI Assistant</label>
                <button 
                    type="button"
                    onClick={handleSuggestReply}
                    disabled={suggestionLoading}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-blue-400 transition-colors disabled:opacity-50"
                >
                    {isEnterprise ? (
                        <>
                            <Sparkles size={12} className={suggestionLoading ? "animate-pulse" : ""} />
                            {suggestionLoading ? 'Thinking...' : 'Suggest Reply'}
                        </>
                    ) : (
                        <>
                            <Lock size={10} className="text-slate-500" />
                            <span className="text-slate-500">
                                <a href="/pricing" className="text-blue-600 hover:underline">Upgrade to Pro</a> to get AI Suggestion
                            </span>
                        </>
                    )}
                </button>
             </div>

             {suggestion && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative group bg-primary/5 border border-primary/20 rounded-xl p-4">
                        <textarea
                            value={editableReply}
                            onChange={(e) => setEditableReply(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-xs text-slate-300 leading-relaxed italic pr-8 focus:ring-0 outline-none resize-none overflow-hidden"
                            placeholder="Edit the reply..."
                            rows={4}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                        />
                        <button 
                            type="button"
                            onClick={copyToClipboard}
                            className="absolute top-3 right-3 p-1.5 bg-slate-900/50 rounded-lg text-slate-400 hover:text-white transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                    
                    <button
                        type="button"
                        onClick={handleSendToDiscord}
                        disabled={sendLoading || !editableReply}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                        {sendLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        {sendLoading ? 'Sending...' : 'Send to Discord'}
                    </button>
                </div>
             )}
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
                onChange={val => {
                    setSelectedTeamId(val);
                    if (autoAssign) handleAutoAssign(val);
                }}
                placeholder="Select team..."
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 mb-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={autoAssign}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setAutoAssign(newValue);
                    if (newValue && selectedTeamId) {
                        handleAutoAssign(selectedTeamId);
                    }
                  }}
                  className="w-4 h-4 rounded border-white/10 bg-slate-950/50 text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">Auto-assign</span>
              </label>
            </div>
          </div>

          {!autoAssign && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignee</label>
               <SearchableSelect
                 options={[
                   { value: '', label: 'Unassigned' },
                   ...profiles.map(p => ({
                     value: p.id,
                     label: p.full_name || p.email?.split('@')[0] || 'Unknown User'
                   }))
                 ]}
                 value={formData.assignee_id}
                 onChange={val => setFormData({ ...formData, assignee_id: val })}
                 placeholder="Select assignee..."
               />
            </div>
          )}


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

          {/* Comments Section */}
          <div className="border-t border-white/5 bg-white/5 p-4 sm:p-6">
            <CommentList ticketId={typeof ticket.id === 'string' ? parseInt(ticket.id) : ticket.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTicketModal;
