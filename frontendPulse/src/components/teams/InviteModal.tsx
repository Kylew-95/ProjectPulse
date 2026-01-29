import { X } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import { TEAM_ROLES } from '../../constants/roles';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  inviteIdentifier: string;
  setInviteIdentifier: (val: string) => void;
  inviteRole: string;
  setInviteRole: (val: string) => void;
  loading: boolean;
}

const InviteModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  inviteIdentifier, 
  setInviteIdentifier, 
  inviteRole, 
  setInviteRole, 
  loading 
}: InviteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-surface border border-border-main rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border-main flex items-center justify-between bg-surface/50">
          <h2 className="text-xl font-bold text-text-primary">Invite Team Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface/80 rounded-lg text-text-secondary transition-colors" aria-label="Close modal">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Discord ID or Email</label>
            <input 
              type="text" 
              required
              value={inviteIdentifier}
              onChange={(e) => setInviteIdentifier(e.target.value)}
              placeholder="Discord ID (e.g. 123456) or Email"
              className="w-full bg-background dark:bg-slate-950/50 border border-border-main rounded-xl px-4 py-3 text-text-primary outline-none focus:border-primary transition-all placeholder:text-text-secondary/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Role</label>
            <SearchableSelect
              options={TEAM_ROLES.map(role => ({ value: role, label: role }))}
              value={inviteRole}
              onChange={setInviteRole}
              placeholder="Select a role..."
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 active:scale-95">
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
