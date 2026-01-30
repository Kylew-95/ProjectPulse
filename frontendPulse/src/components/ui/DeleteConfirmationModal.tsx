import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  isDanger?: boolean;
}

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false,
  isDanger = true
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border-main rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-main bg-surface/50">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${isDanger ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                <AlertTriangle size={20} className={isDanger ? 'text-red-500' : 'text-primary'} aria-hidden="true" />
             </div>
             <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface/80 rounded-lg text-text-secondary transition-colors" aria-label="Close modal">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-text-secondary leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border-main bg-surface/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-8 py-2.5 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' 
                : 'bg-primary hover:bg-blue-600 shadow-primary/20'
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
