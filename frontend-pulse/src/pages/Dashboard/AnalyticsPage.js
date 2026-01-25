import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

function AnalyticsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', session.user.id);
        
        setTickets(data || []);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return null;

  // Aggregate Status Distribution
  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const distribution = [
    { label: 'Open', count: statusCounts['OPEN'] || 0, color: 'bg-primary' },
    { label: 'Resolved', count: (statusCounts['CLOSED'] || 0) + (statusCounts['RESOLVED'] || 0), color: 'bg-emerald-500' },
  ];

  // Aggregate Volume by Date (Last 7 Days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const volumeByDate = last7Days.map(date => {
    const count = tickets.filter(t => t.created_at.startsWith(date)).length;
    return { date, count };
  });

  const maxVolume = Math.max(...volumeByDate.map(v => v.count), 1);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Real Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface border border-slate-800 rounded-2xl p-8">
          <h3 className="text-lg font-semibold mb-6">Ticket Volume (Last 7 Days)</h3>
          <div className="h-64 flex items-end justify-between gap-4">
            {volumeByDate.map((v, i) => (
              <div key={i} className="flex-1 space-y-2 group flex flex-col items-center">
                <div 
                    className="w-full bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg relative"
                    style={{ height: `${(v.count / maxVolume) * 100}%`, minHeight: v.count > 0 ? '4px' : '0' }}
                >
                    {v.count > 0 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-primary">
                          {v.count}
                      </div>
                    )}
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{v.date.split('-').slice(1).join('/')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-slate-800 rounded-2xl p-8">
          <h3 className="text-lg font-semibold mb-6">Distribution by Status</h3>
          <div className="space-y-6">
            {distribution.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-bold">{item.count}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} transition-all duration-500`} 
                    style={{ width: `${tickets.length > 0 ? (item.count / tickets.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          {tickets.length === 0 && (
            <p className="text-center text-slate-500 mt-10 text-sm italic">No data to display</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
