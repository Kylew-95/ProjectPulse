import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { CreditCard, Rocket, Check, Share2 } from 'lucide-react';

const Settings = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [guildId, setGuildId] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
      if (profile?.discord_guild_id) {
          setGuildId(profile.discord_guild_id);
      }
  }, [profile]);

  const handleUpdateGuildId = async () => {
      if (!user) return;
      setUpdating(true);
      try {
          const { error } = await supabase.from('profiles').update({ discord_guild_id: guildId }).eq('id', user.id);
          if (error) throw error;
          alert('Guild ID updated successfully');
      } catch (err) {
          console.error('Error updating guild ID:', err);
          alert('Failed to update Guild ID');
      } finally {
          setUpdating(false);
      }
  };

  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/products`);
        if (res.ok) {
          const data = await res.json();
          // Sort by price
          const formatted = data.sort((a: any, b: any) => a.price - b.price).map((p: any) => ({
             name: p.name,
             price: `£${p.price}`,
             period: '/mo',
             features: p.description ? p.description.split(',') : [], // Assuming description contains features or just use generic list
             // Or better, hardcode features based on name if metadata missing
             active: profile?.subscription_tier === p.metadata?.plan_tier_id || (p.name === 'Starter' && !profile?.subscription_tier),
             priceId: p.price_id,
             isEnterprise: p.name === 'Enterprise'
          }));
          setPlans(formatted);
        }
      } catch (e) {
        console.error("Failed to fetch plans", e);
      }
    };
    fetchPlans();
  }, [profile]);

  // Fallback features if description is empty
  const getFeatures = (name: string) => {
      if (name === 'Starter') return ['Up to 3 projects', 'Basic analytics', 'Community support'];
      if (name === 'Pro') return ['Unlimited projects', 'Advanced analytics', 'Priority support', 'Custom workflows'];
      if (name === 'Enterprise') return ['Dedicated account manager', 'SLA', 'SSO', 'Audit logs'];
      return [];
  };

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: priceId,
          user_id: user?.id,
          email: user?.email
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
         console.error('No checkout URL returned', data);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
        setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/create-portal-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user?.email
          }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        console.error('Portal error:', err);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Subscription Section */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Rocket className="text-primary" size={24} /> Subscription
        </h2>
        
        <div className="bg-surface border border-slate-800 rounded-xl overflow-hidden">
           <div className="p-6 border-b border-slate-800">
             <p className="text-sm text-slate-400">Current Plan</p>
             <div className="flex items-baseline gap-2 mt-1">
               <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                 {profile?.subscription_tier?.toUpperCase() || 'NO PLAN'}
               </h3>
               <span className="text-sm px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                 {profile?.status?.toUpperCase() || 'INACTIVE'}
               </span>
             </div>
           </div>

           <div className="p-6 bg-black/20">
             {['active', 'trialing'].includes(profile?.status || '') ? (
               <button 
                 onClick={handlePortal}
                 disabled={loading}
                 className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium border border-slate-700 hover:border-slate-600"
               >
                 {loading ? 'Loading...' : 'Manage Subscription'}
               </button>
             ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.name} className={`flex flex-col p-6 rounded-xl border ${plan.active ? 'border-primary bg-primary/5' : 'border-slate-800 bg-background'}`}>
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <h4 className="font-bold text-lg">{plan.name}</h4>
                           <div className="flex items-baseline mt-1">
                             <span className="text-2xl font-bold">{plan.price}</span>
                             <span className="text-slate-500 text-sm">{plan.period}</span>
                           </div>
                           <p className="text-xs text-slate-500 mt-1">
                             {plan.name === 'Starter' ? 'Inc. VAT' : plan.name === 'Enterprise' ? 'Inc. VAT' : '+ VAT'}
                           </p>
                         </div>
                         {plan.active && <CheckCircle className="text-primary" />}
                       </div>
                       <ul className="space-y-3 mb-6 flex-1">
                         {(plan.features.length ? plan.features : getFeatures(plan.name)).map((f: string) => (
                           <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                             <Check size={16} className="text-primary shrink-0" /> {f}
                           </li>
                         ))}
                       </ul>
                       
                       {plan.active ? (
                           <button disabled className="w-full py-2 bg-slate-800 text-slate-500 rounded-lg cursor-default border border-slate-700">Current Plan</button>
                       ) : plan.isEnterprise ? (
                           <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium border border-slate-700">Contact Sales</button>
                       ) : (
                         <button
                           onClick={() => handleSubscribe(plan.priceId)}
                           disabled={loading}
                           className="w-full py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-lg shadow-primary/20"
                         >
                           {loading ? 'Processing...' : 'Upgrade'}
                         </button>
                       )}
                    </div>
                  ))}
                </div>
             )}
           </div>
        </div>
      </section>

      {/* Integrations Section - Pro & Enterprise Only */}
      {['pro', 'enterprise'].includes(profile?.subscription_tier || '') && (
        <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Share2 className="text-purple-400" size={24} /> Integrations
            </h2>
            <div className="bg-surface border border-slate-800 rounded-xl p-6">
                <p className="text-sm text-slate-400 mb-6">Connect your tools for automated ticket syncing.</p>
                
                <div className="space-y-6">
                    {/* Jira */}
                    <div className="p-4 border border-slate-700 rounded-lg bg-black/20">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                             Jira Integration
                        </h3>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Jira Domain URL</label>
                                <input placeholder="https://your-company.atlassian.net" className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">API Token / Email</label>
                                <input type="password" placeholder="API Token" className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm" />
                            </div>
                            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">Save Jira Config</button>
                        </div>
                    </div>

                    {/* Trello */}
                    <div className="p-4 border border-slate-700 rounded-lg bg-black/20">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                             Trello Integration
                        </h3>
                        <div className="grid gap-4">
                             <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
                                <input className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm" />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">API Token</label>
                                <input type="password" className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm" />
                            </div>
                            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">Save Trello Config</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* Account Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="text-slate-400" size={24} /> Account Details
        </h2>
        <div className="bg-surface border border-slate-800 rounded-xl p-6">
            <div className="grid gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                    <input disabled value={user?.email || ''} className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Discord Guild ID</label>
                    <div className="flex gap-2">
                        <input 
                            value={guildId} 
                            onChange={(e) => setGuildId(e.target.value)}
                            placeholder="Enter your Discord Server ID"
                            className="w-full bg-black/20 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none" 
                        />
                        <button 
                            onClick={handleUpdateGuildId}
                            disabled={updating || guildId === (profile?.discord_guild_id || '')}
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
    </div>
  );
};

// Start simple helper
const CheckCircle = ({ className }: {className?: string}) => (
    <div className={`w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center ${className}`}>
        <Check size={14} />
    </div>
);

export default Settings;
