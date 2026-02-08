import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, RefreshCw, ShieldAlert } from 'lucide-react';

interface AuditLog {
  id: number;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [refreshKey]);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      // Join with profiles to get actor names
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:actor_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (error.code === 'PGRST205') {
          setErrorStatus('TABLE_MISSING');
        } else {
          throw error;
        }
      }
      setLogs((data || []) as unknown as AuditLog[]);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setErrorStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldAlert className="text-blue-600" size={20} />
          System Audit Logs
        </h3>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="p-2 bg-surface border border-border-main rounded-lg hover:bg-background transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border-main rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background/50 border-b border-border-main text-muted font-medium">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading && logs.length === 0 ? (
                 <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Loading logs...</td></tr>
              ) : errorStatus === 'TABLE_MISSING' ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="max-w-md mx-auto">
                      <ShieldAlert className="text-amber-500 mx-auto mb-3 opacity-50" size={32} />
                      <h4 className="font-semibold text-main mb-2">Audit Logs Setup Required</h4>
                      <p className="text-xs text-muted leading-relaxed mb-4">
                        The audit_logs table hasn't been created in your Supabase database yet. 
                        Please run the provided SQL migration in your dashboard to enable this feature.
                      </p>
                      <button 
                        onClick={() => window.open('https://supabase.com/dashboard/project/ztzmykkriwjlsijazvoi/sql', '_blank')}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                      >
                        Open SQL Editor
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                 <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No audit logs found</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-background/30 transition-colors bg-surface">
                    <td className="px-4 py-3 text-muted whitespace-nowrap font-mono text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-main">
                      {log.profiles?.full_name || log.profiles?.email || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono border border-border-main">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {log.entity_type} <span className="text-slate-400">#{log.entity_id}</span>
                    </td>
                    <td className="px-4 py-3 text-muted max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                      {JSON.stringify(log.metadata)}
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

export default AuditLogViewer;
