import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

function Overview() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    async function fetchData() {
      try {
        setLoading(true);
        // Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileData) setProfile(profileData);

        // Fetch Top 2 Tickets
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(2);
        
        // Fetch All Tickets for counts
        const { data: allTicketsData } = await supabase
          .from('tickets')
          .select('status')
          .eq('user_id', session.user.id);

        setTickets(ticketData || []);
        setAllTickets(allTicketsData || []);

      } catch (error) {
        console.error('Error fetching overview data:', error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Tickets', value: allTickets.length },
    { label: 'Open Tickets', value: allTickets.filter(t => t.status === 'OPEN').length },
    { label: 'Resolved', value: allTickets.filter(t => t.status === 'CLOSED' || t.status === 'RESOLVED').length },
    { label: 'Plan Tier', value: profile?.subscription_tier?.toUpperCase() || 'FREE' },
  ];

  return (
    <div className="animate-fade-in text-white">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface border border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="text-sm text-slate-400 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-primary/5 rounded-tl-full -mr-4 -mb-4 group-hover:bg-primary/10 transition-colors"></div>
          </div>
        ))}
      </div>

      {/* Active Tickets Section */}
      <div className="bg-surface border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Active Tickets (Top 2)</h2>
        <div className="space-y-4">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 rounded-lg bg-background border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${ticket.urgency > 7 ? 'bg-red-500' : 'bg-primary'}`}></div>
                  <div>
                    <span className="font-medium block">{ticket.summary || 'No Summary'}</span>
                    <span className="text-xs text-slate-500">{ticket.issue?.substring(0, 60)}...</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
              No active tickets found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Overview;
