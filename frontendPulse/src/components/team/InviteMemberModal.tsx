import React, { useState } from 'react';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InviteMemberModal = ({ isOpen, onClose, onSuccess }: InviteMemberModalProps) => {
  const [loading, setLoading] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier) return;
    
    const isDiscord = /^\d+$/.test(inviteIdentifier);
    
    setLoading(true);
    try {
      // Check if already exists
      const checkColumn = isDiscord ? 'discord_id' : 'email';
      const { data: existing, error: checkError } = await supabase
        .from('team_members')
        .select('id')
        .eq(checkColumn, inviteIdentifier)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        alert('This user is already in the team (or has already been invited).');
        setLoading(false);
        return;
      }

      const payload = {
        [checkColumn]: inviteIdentifier,
        role: inviteRole,
        status: 'invited',
        joined_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('team_members').insert(payload);

      if (error) throw error;
      
      // If invitation is via email, trigger the backend email
      if (!isDiscord) {
          try {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
              await fetch(`${apiUrl}/send-invite`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: inviteIdentifier, role: inviteRole })
              });
          } catch (emailErr) {
              console.error('Failed to reach backend for email:', emailErr);
          }
      }
      
      onClose();
      if (onSuccess) onSuccess();
      else window.location.reload();
    } catch (err: any) {
      console.error('Error inviting member:', err);
      alert('Failed to invite: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={handleInvite}>
           <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Discord ID or Email</label>
              <input 
                type="text" 
                required
                value={inviteIdentifier}
                onChange={(e) => setInviteIdentifier(e.target.value)}
                placeholder="Discord ID (e.g. 123456) or Email"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary transition-all"
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Role</label>
              <div className="relative">
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary transition-all appearance-none"
                  >
                    <option value="Developer">Developer</option>
                    <option value="Scrum Master">Scrum Master</option>
                    <option value="Product Owner">Product Owner</option>
                    <option value="Designer">Designer</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Admin">Admin</option>
                  </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
           </div>
           <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
