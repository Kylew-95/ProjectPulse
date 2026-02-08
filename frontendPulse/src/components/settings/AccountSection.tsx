import { useState } from 'react';
import { CreditCard, Save } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../../types/auth';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface AccountSectionProps {
  user: User | null;
  profile: Profile | null;
}

const AccountSection = ({ user, profile }: AccountSectionProps) => {
  const { refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh the profile context to update UI everywhere
      await refreshProfile();
      
      toast.success('Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
        <CreditCard className="text-slate-400" size={24} /> Account Details
      </h2>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl p-3">
          <div className="grid gap-3">
              <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input 
                    disabled 
                    value={user?.email || ''} 
                    className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-surface border border-border-main rounded-lg px-4 py-2 text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  />
              </div>
              <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || fullName === profile?.full_name}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
              </div>
          </div>
      </div>
    </section>
  );
};

export default AccountSection;
