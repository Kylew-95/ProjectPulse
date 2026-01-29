import { Shield, MoreHorizontal, Check } from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PermissionsModal = ({ isOpen, onClose }: PermissionsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Shield className="text-primary" />
             <h2 className="text-xl font-bold text-white">Role Permissions</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
             <MoreHorizontal size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
           <div className="grid grid-cols-2 gap-8">
              <div>
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-white/5 pb-2">Admin</h3>
                 <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Manage team & roles</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Delete any work item</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> View financial analytics</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Manage subscriptions</li>
                 </ul>
              </div>
              <div>
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-white/5 pb-2">Member</h3>
                 <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Create tickets</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Edit assigned tickets</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Comment on tasks</li>
                    <li className="flex items-center gap-2 text-slate-600 italic">No admin access</li>
                 </ul>
              </div>
           </div>
        </div>
        <div className="p-6 bg-white/5 border-t border-white/5 text-right">
           <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all">Close</button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal;
