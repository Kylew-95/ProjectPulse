import { useState } from 'react';
import { Trash2, Users, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMutation as useMutationReact } from '@apollo/client/react';
import type { ExecutionResult } from 'graphql';
import { BULK_UPDATE_TICKETS, BULK_DELETE_TICKETS } from '../../graphql/operations';
import toast from 'react-hot-toast';

interface BulkActionToolbarProps {
  selectedIds: (string | number)[];
  onClearSelection: () => void;
  onActionComplete: () => void;
  profiles: { id: string; full_name: string | null; email: string | null }[];
}

interface BulkUpdateData {
  updateticketsCollection: {
    records: { id: string }[];
  };
}

interface BulkDeleteData {
  deleteFromticketsCollection: {
    records: { id: string }[];
  };
}

const BulkActionToolbar = ({ 
  selectedIds, 
  onClearSelection, 
  onActionComplete,
  profiles 
}: BulkActionToolbarProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkUpdateMutation] = useMutationReact<BulkUpdateData>(BULK_UPDATE_TICKETS);
  const [bulkDeleteMutation] = useMutationReact<BulkDeleteData>(BULK_DELETE_TICKETS);

  const handleBulkAssign = async (assigneeId: string) => {
    setIsProcessing(true);
    try {
      const result: ExecutionResult<BulkUpdateData> = await bulkUpdateMutation({
        variables: {
          filter: { id: { in: selectedIds } },
          set: { assignee_id: assigneeId === 'unassign' ? null : assigneeId }
        }
      });

      if (result.errors) throw new Error(result.errors[0].message);

      toast.success(`${selectedIds.length} ticket(s) ${assigneeId === 'unassign' ? 'unassigned' : 'assigned'}!`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Error bulk assigning:', error);
      toast.error('Failed to assign tickets');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatus = async (status: string) => {
    setIsProcessing(true);
    try {
      const result: ExecutionResult<BulkUpdateData> = await bulkUpdateMutation({
        variables: {
          filter: { id: { in: selectedIds } },
          set: { status }
        }
      });

      if (result.errors) throw new Error(result.errors[0].message);

      toast.success(`${selectedIds.length} ticket(s) updated to ${status}!`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPriority = async (priority: string) => {
    setIsProcessing(true);
    try {
      const result: ExecutionResult<BulkUpdateData> = await bulkUpdateMutation({
        variables: {
          filter: { id: { in: selectedIds } },
          set: { priority }
        }
      });

      if (result.errors) throw new Error(result.errors[0].message);

      toast.success(`${selectedIds.length} ticket(s) priority updated!`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Error bulk updating priority:', error);
      toast.error('Failed to update priority');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} ticket(s)? This cannot be undone.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const result: ExecutionResult<BulkDeleteData> = await bulkDeleteMutation({
        variables: {
          filter: { id: { in: selectedIds } }
        }
      });

      if (result.errors) throw new Error(result.errors[0].message);

      toast.success(`${selectedIds.length} ticket(s) deleted!`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete tickets');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-surface border border-border-main rounded-2xl shadow-2xl p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg">
          <CheckCircle2 size={18} className="text-blue-500" />
          <span className="text-sm font-medium text-main">
            {selectedIds.length} selected
          </span>
        </div>

        <div className="h-6 w-px bg-border-main" />

        {/* Assign */}
        <div className="flex items-center gap-2">
          <Users size={16} className="text-muted" />
          <select
            onChange={(e) => handleBulkAssign(e.target.value)}
            disabled={isProcessing}
            className="bg-background border border-border-main rounded-lg px-3 py-1.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            defaultValue=""
          >
            <option value="" disabled>Assign to...</option>
            <option value="unassign">Unassign</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email?.split('@')[0] || 'User'}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-muted" />
          <select
            onChange={(e) => handleBulkStatus(e.target.value)}
            disabled={isProcessing}
            className="bg-background border border-border-main rounded-lg px-3 py-1.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            defaultValue=""
          >
            <option value="" disabled>Change status...</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-muted" />
          <select
            onChange={(e) => handleBulkPriority(e.target.value)}
            disabled={isProcessing}
            className="bg-background border border-border-main rounded-lg px-3 py-1.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            defaultValue=""
          >
            <option value="" disabled>Change priority...</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="h-6 w-px bg-border-main" />

        {/* Delete */}
        <button
          onClick={handleBulkDelete}
          disabled={isProcessing}
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          title="Delete selected"
        >
          <Trash2 size={18} />
        </button>

        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 text-sm text-muted hover:text-main transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default BulkActionToolbar;
