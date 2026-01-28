import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface AccountSectionProps {
  user: any;
  profile: any;
}

const AccountSection = ({ user, profile }: AccountSectionProps) => {
  const [guildId, setGuildId] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
      if (profile?.discord_guild_id) {
          setGuildId(profile.discord_guild_id);
      }
  }, [profile]);

  const handleUpdateGuildId = async () => {
      // Input Validation: Numeric Only (Discord IDs are typically 17-20 digits)
      const sanitized = guildId.trim();
      // Length check is handled by button disabled state
      
      if (!user) return;
      setUpdating(true);
      try {
          const { error } = await supabase.from('profiles').update({ discord_guild_id: sanitized }).eq('id', user.id);
          if (error) throw error;
          alert('Guild ID updated successfully');
      } catch (err) {
          console.error('Error updating guild ID:', err);
          alert('Failed to update Guild ID');
      } finally {
          setUpdating(false);
      }
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="text-slate-400" size={24} /> Account Details
      </h2>
      <div className="bg-surface border border-slate-800 rounded-xl p-6">
          <div className="grid gap-6">
              <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input disabled value={user?.user_metadata.email || ''} className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Discord Guild ID</label>
                  <div className="flex gap-2">
                      <input 
                          value={guildId} 
                          onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val)) {
                                  setGuildId(val);
                              }
                          }}
                          placeholder="Enter your Discord Server ID"
                          className="w-full bg-black/20 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none" 
                      />
                      <button 
                          onClick={handleUpdateGuildId}
                          disabled={updating || guildId === (profile?.discord_guild_id || '') || guildId.length < 17 || guildId.length > 20}
                          className="px-4 py-2 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium whitespace-nowrap"
                      >
                          {updating ? 'Saving...' : 'Save ID'}
                      </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                      Required for the bot to function in your server. Right-click your server icon in Discord &gt; Copy ID (Developer Mode required).
                  </p>
              </div>
          </div>
      </div>
    </section>
  );
};

export default AccountSection;
