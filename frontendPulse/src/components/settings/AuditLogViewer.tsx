import { useState, useEffect } from 'react';
import { useQuery as useQueryReact, useMutation as useMutationReact } from '@apollo/client/react';
import { GET_AUDIT_LOGS, DELETE_AUDIT_LOGS, DELETE_AUDIT_LOG_BATCH, GET_LOG_IDS_FOR_DELETION } from '../../graphql/operations';
import { Search, RefreshCw, ShieldAlert, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';
import ClearAuditLogsModal from '../ui/ClearAuditLogsModal';

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

interface DeleteLogsData {
  deleteFromaudit_logsCollection: {
    records: { id: string }[];
  };
}

interface LogIdsData {
  audit_logsCollection: {
    edges: {
      node: {
        id: string;
      };
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { profile } = useAuth();

  const isAdmin = profile?.subscription_tier?.toLowerCase() === 'super_admin' || 
    profile?.status === 'active'; 
    // However, the database function is_admin checks team_members. 
    // Since this is System Audit, super_admin is the primary target.

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

  const [deleteLogs] = useMutationReact<DeleteLogsData>(DELETE_AUDIT_LOGS, {
    onCompleted: () => {
      console.log('Parent: onCompleted firing');
      refetchLogs();
    },
    onError: (error) => {
      console.error('Parent: useMutation onError hook caught:', error);
      alert(`Mutation Error: ${error.message}`);
    }
  });

  const [deleteBatch] = useMutationReact<DeleteLogsData>(DELETE_AUDIT_LOG_BATCH);

  // Helper hook for fetching IDs during clear all
  const { refetch: fetchNextBatchIds } = useQueryReact<LogIdsData>(GET_LOG_IDS_FOR_DELETION, {
    skip: true, // Only use refetch manually
    variables: { first: 50 },
    notifyOnNetworkStatusChange: true
  });

  const handleDeleteLog = (id: number) => {
    setSelectedLogId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteLog = async () => {
    if (!selectedLogId) return;
    setIsDeleting(true);
    console.log('Attempting to delete log:', selectedLogId);
    try {
      const result = await deleteLogs({
        variables: {
          filter: { id: { eq: selectedLogId } }
        }
      });
      console.log('Delete result:', result);
      setIsDeleteModalOpen(false);
      setSelectedLogId(null);
    } catch (err) {
      console.error('Failed to delete log:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearLogs = () => {
    setIsClearModalOpen(true);
  };

  const confirmClearLogs = async () => {
    console.log('Parent: confirmClearLogs initiated (ID-Targeted Batched Mode)');
    setIsDeleting(true);
    
    try {
      let deletedCount = 0;
      let hasMore = true;
      const BATCH_SIZE = 20;

      while (hasMore) {
        console.log(`Parent: Fetching next batch of ${BATCH_SIZE} IDs...`);
        // Fetch IDs fresh from DB to avoid state staleness or RLS issues
        const { data: idData } = await fetchNextBatchIds({ first: BATCH_SIZE });
        const edges = idData?.audit_logsCollection?.edges || [];
        const idsToDelete: string[] = edges.map((e) => e.node.id);
        
        if (idsToDelete.length === 0) {
          console.log('Parent: No more IDs found. Finished.');
          hasMore = false;
          break;
        }

        console.log(`Parent: Deleting batch of ${idsToDelete.length} specific IDs...`);
        const result = await deleteBatch({
          variables: {
            filter: { id: { in: idsToDelete } },
            atMost: BATCH_SIZE
          }
        });
        
        const records = result.data?.deleteFromaudit_logsCollection?.records || [];
        console.log(`Parent: Successfully deleted ${records.length} records in this batch.`);
        
        deletedCount += records.length;
        
        if (records.length < BATCH_SIZE && records.length < idsToDelete.length) {
          // If we deleted fewer than we asked for, something might be up (RLS?)
          console.warn('Parent: Deleted fewer records than expected in batch. Stopping.');
          hasMore = false;
        } else {
          // Small delay before next batch
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        // Safety break
        if (deletedCount > 5000) {
          console.warn('Parent: High deletion volume (5k). Stopping for safety.');
          hasMore = false;
        }
      }

      console.log(`Parent: Targeted batched clear completed. Total deleted: ${deletedCount}`);
      setLogs([]);
      refetchLogs();
      setIsClearModalOpen(false);
      console.log('Parent: Logs state cleared and modal closed');
    } catch (err) {
      console.error('Parent: Targeted batch mutation failed:', err);
      const error = err as Error;
      alert(`Failed to clear logs during batching: ${error.message}`);
    } finally {
      setIsDeleting(false);
      console.log('Parent: isDeleting set back to false');
    }
  };

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
      
      const actions = Array.from(new Set(fetchedLogs.map((l: AuditLog) => l.action).filter(Boolean))) as string[];
      setAvailableActions(actions);
      
      const entities = Array.from(new Set(fetchedLogs.map((l: AuditLog) => l.entity_type).filter(Boolean))) as string[];
      setAvailableEntities(entities);
    }
  }, [logData]);

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
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isAdmin && (
                <button 
                  onClick={handleClearLogs}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-xs font-medium"
                  title="Clear all logs"
                >
                  <AlertTriangle size={14} />
                  Clear All
                </button>
              )}
              <button 
                onClick={() => refetchLogs()}
                className="p-2 bg-surface border border-border-main rounded-lg hover:bg-background transition-colors"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
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
                {isAdmin && <th className="px-4 py-3 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading && logs.length === 0 ? (
                 <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-muted">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                 <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-muted">No audit logs found</td></tr>
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
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete log entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteLog}
        title="Delete Log Entry"
        message="Are you sure you want to delete this system audit log entry? This action cannot be undone."
        loading={isDeleting}
      />

      <ClearAuditLogsModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={confirmClearLogs}
        loading={isDeleting}
      />
    </div>
  );
};

export default AuditLogViewer;
