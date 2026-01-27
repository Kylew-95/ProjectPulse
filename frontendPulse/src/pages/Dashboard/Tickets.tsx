import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Plus, Search, Trash2, MoreHorizontal } from 'lucide-react';
import CreateTicketModal from '../../components/tickets/CreateTicketModal';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  assignee: string | null;
}

const Tickets = () => {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTickets = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [session]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      setTickets(tickets.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
      try {
          const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
          if (error) throw error;
          setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
      } catch (err) {
          console.error('Error updating status:', err);
      }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Tickets</h1>
          <p className="text-slate-400 mt-2">Manage and track your tasks.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> New Ticket
        </button>
      </div>

      {isModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsModalOpen(false)} 
          onTicketCreated={fetchTickets}
        />
      )}

      <div className="bg-surface border border-slate-800 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              className="w-full bg-black/20 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-slate-400 text-xs uppercase font-medium border-b border-slate-800">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading tickets...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No tickets found. Create one to get started.</td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{ticket.title}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={ticket.status}
                        onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border bg-transparent outline-none cursor-pointer ${getStatusColor(ticket.status)}`}
                      >
                        <option value="open" className="bg-slate-800 text-slate-300">Open</option>
                        <option value="in_progress" className="bg-slate-800 text-blue-400">In Progress</option>
                        <option value="done" className="bg-slate-800 text-green-400">Done</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-300 capitalize">{ticket.priority}</td>
                    <td className="px-6 py-4 text-slate-300 flex items-center gap-2">
                       {ticket.assignee ? <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">A</div> : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(ticket.id)}
                          className="text-slate-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                          title="Delete Ticket"
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tickets;
