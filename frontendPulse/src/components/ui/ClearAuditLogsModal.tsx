import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ClearAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const ClearAuditLogsModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: ClearAuditLogsModalProps) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const isVerified = inputValue === 'DELETE';

  const handleConfirm = () => {
    console.log('Modal: handleConfirm triggered. isVerified:', isVerified);
    if (isVerified) {
      console.log('Modal: Calling onConfirm from parent');
      onConfirm();
    } else {
      console.warn('Modal: handleConfirm called but isVerified is false');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border-main rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-main bg-surface/50">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle size={20} className="text-red-500" aria-hidden="true" />
             </div>
             <h2 className="text-xl font-bold text-text-primary">Clear Audit Logs</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface/80 rounded-lg text-text-secondary transition-colors" aria-label="Close modal">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-text-secondary leading-relaxed">
            This action will permanently delete ALL system audit logs. This cannot be undone.
          </p>
          <div className="space-y-2">
            <label htmlFor="delete-confirm" className="text-sm font-medium text-text-secondary">
              Type <span className="font-bold text-red-500">DELETE</span> to confirm:
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type DELETE..."
              autoFocus
              className="w-full px-4 py-2 bg-background border border-border-main rounded-xl text-text-primary focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border-main bg-surface/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !isVerified}
            className="px-8 py-2.5 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 bg-red-600 hover:bg-red-500 shadow-red-500/20"
          >
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {loading ? 'Clearing...' : 'Clear All Logs'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearAuditLogsModal;
