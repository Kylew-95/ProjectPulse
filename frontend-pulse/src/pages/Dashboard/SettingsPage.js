import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (data) setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error.message);
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, []);

  if (loading) return null;

  const isIntegrationDisabled = !['pro', 'enterprise'].includes(profile?.subscription_tier?.toLowerCase());

  // Helper
  const getTrialDaysLeft = () => {
    if (!profile?.trial_end) return 0;
    const end = new Date(profile.trial_end);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const trialDays = getTrialDaysLeft();
  const isCanceled = ['canceled', 'past_due', 'unpaid'].includes(profile?.status);
  const isTrialing = !isCanceled && ((profile?.status === 'trialing') || (trialDays > 0 && trialDays < 30));

  return (
    <div className="animate-fade-in max-w-4xl">
      <h2 className="text-2xl font-bold mb-8">Workspace Settings</h2>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="bg-surface border border-slate-800 rounded-2xl p-8">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Plan & Billing
          </h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-slate-800">
            <div className="flex flex-col items-start">
              <p className="text-sm text-slate-400 mb-1">Current Plan</p>
              
              <div className="flex items-center gap-2">
                 <p className="text-lg font-bold text-primary">{profile?.subscription_tier?.toUpperCase() || 'FREE'}</p>
                 {isTrialing && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Free Trial
                    </span>
                 )}
                 {isCanceled && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Canceled
                    </span>
                 )}
              </div>
              
              {isTrialing && (
                 <p className="text-sm font-medium text-slate-400 mt-0.5">
                   {trialDays} {trialDays === 1 ? 'day' : 'days'} left
                 </p>
              )}
            </div>
            <button 
              onClick={() => navigate('/dashboard/settings/subscription')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors border border-slate-700"
            >
               Manage Subscription
            </button>
          </div>
        </section>

        {/* Integration Section */}
        <section className={`bg-surface border border-slate-800 rounded-2xl p-8 relative overflow-hidden ${isIntegrationDisabled ? 'opacity-75' : ''}`}>
          {isIntegrationDisabled && (
            <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-6 text-center">
              <div className="max-w-xs bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl">
                <svg className="w-10 h-10 text-amber-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m8-3V7a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h4l2 2 2-2h4a2 2 0 002-2z" />
                </svg>
                <h4 className="font-bold mb-2">Pro Feature</h4>
                <p className="text-xs text-slate-400 mb-4">Connect Jira or Trello to automate your ticketing workflow.</p>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg mb-2"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
            </svg>
            Automations & Integrations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-300">Trello</h4>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="API Key" 
                  disabled={isIntegrationDisabled}
                  className="w-full bg-background border border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:bg-slate-900/50"
                />
                <input 
                  type="password" 
                  placeholder="Token" 
                  disabled={isIntegrationDisabled}
                  className="w-full bg-background border border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:bg-slate-900/50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-300">Jira</h4>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Instance URL (https://your-domain.atlassian.net)" 
                  disabled={isIntegrationDisabled}
                  className="w-full bg-background border border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:bg-slate-900/50"
                />
                <input 
                  type="password" 
                  placeholder="API Token" 
                  disabled={isIntegrationDisabled}
                  className="w-full bg-background border border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:bg-slate-900/50"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex justify-end">
            <button 
              disabled={isIntegrationDisabled}
              className="px-6 py-2 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              Save Connections
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
