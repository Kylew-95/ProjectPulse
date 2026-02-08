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
  currentMemberCount: number;
  subscriptionTier: string;
}

const SUBSCRIPTION_LIMITS = {
  starter: { members: 3 },
  pro: { members: 10 },
  enterprise: { members: Infinity },
  super_admin: { members: Infinity },
};

type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS;

const InviteModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  inviteIdentifier, 
  setInviteIdentifier, 
  inviteRole, 
 
  setInviteRole, 
  loading,
  currentMemberCount,
  subscriptionTier
}: InviteModalProps) => {
  if (!isOpen) return null;

  const tier = (subscriptionTier?.toLowerCase() || 'starter') as SubscriptionTier;
  const limit = SUBSCRIPTION_LIMITS[tier]?.members || 3;
  const isLimitReached = currentMemberCount >= limit;

  // Filter out Admin role
  const availableRoles = TEAM_ROLES.filter(r => r !== 'Admin').map(role => ({ value: role, label: role }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invite Team Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Close modal">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="flex flex-col flex-1 min-h-0" onSubmit={onSubmit}>
          {/* Scrollable Body */}
          <div className="p-8 space-y-6 overflow-y-auto flex-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">Discord ID or Email</label>
              <input 
                type="text" 
                required
                value={inviteIdentifier}
                onChange={(e) => setInviteIdentifier(e.target.value)}
                placeholder="Discord ID (e.g. 123456) or Email"
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                autoFocus
                disabled={isLimitReached}
              />
            </div>

            {isLimitReached && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[13px] text-red-600 dark:text-red-400 font-medium leading-relaxed">
                Team member limit reached ({currentMemberCount}/{limit}). Upgrade to invite more members.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">Role</label>
              <SearchableSelect
                options={availableRoles}
                value={inviteRole}
                onChange={setInviteRole}
                placeholder="Select a role..."
                isDisabled={isLimitReached}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex-shrink-0 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">Cancel</button>
            <button type="submit" disabled={loading || isLimitReached} className="flex-1 py-3 bg-primary hover:bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:scale-100">
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default InviteModal;
