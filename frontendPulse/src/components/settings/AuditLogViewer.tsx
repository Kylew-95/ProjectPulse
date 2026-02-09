import { useState, useEffect, useCallback } from 'react';
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableEntities, setAvailableEntities] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchFilterOptions = useCallback(async () => {
    try {
        console.log('[AuditLogViewer] Fetching filter options...');
        const { data: actionData } = await supabase
            .from('audit_logs')
            .select('action');
        
        const { data: entityData } = await supabase
            .from('audit_logs')
            .select('entity_type');

        if (actionData) {
            const uniqueActions = Array.from(new Set(actionData.map(a => a.action))).sort();
            console.log('[AuditLogViewer] Found actions:', uniqueActions);
            setAvailableActions(uniqueActions);
        }
        if (entityData) {
            const uniqueEntities = Array.from(new Set(entityData.map(e => e.entity_type))).sort();
            console.log('[AuditLogViewer] Found entities:', uniqueEntities);
            setAvailableEntities(uniqueEntities);
        }
    } catch (err) {
        console.error('[AuditLogViewer] Error fetching filter options:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      console.log('[AuditLogViewer] Fetching logs with filters:', { debouncedSearch, filterAction, filterEntity });
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:actor_id (full_name, email)
        `);

      // Server-side search
      if (debouncedSearch) {
        query = query.or(`action.ilike.%${debouncedSearch}%,entity_type.ilike.%${debouncedSearch}%,entity_id.ilike.%${debouncedSearch}%`);
      }

      // Server-side filters
      if (filterAction) {
        query = query.eq('action', filterAction);
      }
      if (filterEntity) {
        query = query.eq('entity_type', filterEntity);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        if (error.code === 'PGRST205') {
          setErrorStatus('TABLE_MISSING');
        } else {
          throw error;
        }
      }
      console.log('[AuditLogViewer] Fetched logs count:', data?.length || 0);
      setLogs((data || []) as unknown as AuditLog[]);
    } catch (err) {
      console.error('[AuditLogViewer] Error fetching audit logs:', err);
      setErrorStatus('ERROR');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterAction, filterEntity]);

  // Fetch filter options once
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchLogs();
  }, [refreshKey, fetchLogs]);

  // No longer hardcoded - fetched from DB
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="text-blue-600" size={20} />
              System Audit Logs
            </h3>
            <button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="p-2 bg-surface border border-border-main rounded-lg hover:bg-background transition-colors self-end sm:self-auto"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search action or entity..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border-main rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          
          <select 
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 bg-surface border border-border-main rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Actions</option>
            {availableActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          <select 
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="px-4 py-2 bg-surface border border-border-main rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Entities</option>
            {availableEntities.map(entity => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface border border-border-main rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
          <table className="w-full text-left text-sm relative border-collapse">
            <thead className="bg-background/50 border-b border-border-main text-muted font-medium sticky top-0 z-10 backdrop-blur-sm">
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
              ) : logs.length === 0 ? (
                 <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No audit logs found</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-background/30 transition-colors bg-surface">
                    <td className="px-4 py-3 text-muted whitespace-nowrap font-mono text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-main">
                      {log.profiles?.full_name || log.profiles?.email || 'System'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono border border-border-main">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {log.entity_type} <span className="text-slate-400 font-mono text-[10px]">#{log.entity_id.substring(0, 8)}...</span>
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
