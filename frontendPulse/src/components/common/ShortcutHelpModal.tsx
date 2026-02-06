import { X, Keyboard } from 'lucide-react';

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutHelpModal = ({ isOpen, onClose }: ShortcutHelpModalProps) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['g', 't'], description: 'Go to Tickets' },
        { keys: ['g', 'a'], description: 'Go to Analytics' },
        { keys: ['g', 'o'], description: 'Go to Overview' },
        { keys: ['g', 'k'], description: 'Go to Kanban' },
        { keys: ['g', 's'], description: 'Go to Settings' },
      ],
    },
    {
      category: 'Actions',
      items: [
        { keys: ['c'], description: 'Create new ticket' },
        { keys: ['/'], description: 'Focus search' },
        { keys: ['?'], description: 'Show this help' },
        { keys: ['Esc'], description: 'Close modals' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border-main rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border-main">
          <div className="flex items-center gap-3">
            <Keyboard className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-main">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface/80 rounded-lg text-muted hover:text-main transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border-main"
                  >
                    <span className="text-sm text-main">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-mono bg-surface border border-border-main rounded text-main shadow-sm">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted">then</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-border-main bg-surface/50">
          <p className="text-xs text-muted text-center">
            Press <kbd className="px-2 py-0.5 text-xs font-mono bg-background border border-border-main rounded">?</kbd> anytime to view shortcuts
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutHelpModal;
