import { useState, useEffect } from 'react';
import { useQuery as useQueryReact } from '@apollo/client/react';
import { GET_AUDIT_LOGS } from '../../graphql/operations';
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

interface GetAuditLogsData {
  audit_logsCollection: {
    edges: {
      node: AuditLog;
    }[];
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

  // GraphQL Hooks
  const { data: logData, loading: isQueryLoading, refetch: refetchLogs } = useQueryReact<GetAuditLogsData>(GET_AUDIT_LOGS, {
    variables: {
      filter: {
        _or: debouncedSearch ? [
          { action: { ilike: `%${debouncedSearch}%` } },
          { entity_type: { ilike: `%${debouncedSearch}%` } },
          { entity_id: { ilike: `%${debouncedSearch}%` } }
        ] : undefined,
        action: filterAction ? { eq: filterAction } : undefined,
        entity_type: filterEntity ? { eq: filterEntity } : undefined
      },
      orderBy: [{ created_at: 'DescNullsLast' }],
      first: 100
    }
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (logData?.audit_logsCollection) {
      const fetchedLogs = logData.audit_logsCollection.edges.map(e => e.node);
      setLogs(fetchedLogs);
      
      // Extract filter options from initial load if not already set
      if (availableActions.length === 0) {
        const actions = Array.from(new Set(fetchedLogs.map(l => l.action))).sort();
        setAvailableActions(actions);
      }
      if (availableEntities.length === 0) {
        const entities = Array.from(new Set(fetchedLogs.map(l => l.entity_type))).sort();
        setAvailableEntities(entities);
      }
    }
  }, [logData, availableActions.length, availableEntities.length]);

  useEffect(() => {
    setLoading(isQueryLoading);
  }, [isQueryLoading]);

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
              onClick={() => refetchLogs()}
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
