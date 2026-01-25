import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  if (loading) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Tickets</h2>
        <div className="flex gap-2">
            <select className="bg-surface border border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                <option>All Status</option>
                <option>Open</option>
                <option>Closed</option>
            </select>
        </div>
      </div>

      <div className="bg-surface border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-white/5">
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">Issue</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">Urgency</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium block mb-0.5">{ticket.summary}</span>
                  <span className="text-xs text-slate-500 ">{ticket.issue?.substring(0, 50)}...</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    ticket.status === 'OPEN' ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${ticket.urgency > 7 ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                    <span className="text-sm">{ticket.urgency}/10</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            No tickets found.
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketsPage;
