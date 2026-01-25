import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

function ManageSubscription() {
  const { profile, loading, profileLoading } = useAuth();
  const navigate = useNavigate();

  // Only show the ring if we're still determining the session
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If session is found but profile is still loading, show a smaller indicator or wait
  if (!profile && profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel? You will be signed out and won\'t be able to use the free trial again.')) {
        await supabase.auth.signOut();
        navigate('/', { replace: true });
    }
  };

  const planName = profile?.subscription_tier?.replace('_', ' ') || 'No Active Plan';
  
  // Helper logic
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
  const trialEndDate = profile?.trial_end ? new Date(profile.trial_end).toLocaleDateString() : null;
  const status = profile?.status || 'Active';

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/dashboard/settings')}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">Manage Subscription</h2>
      </div>

      <div className="bg-surface border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1 block">Your Plan</span>
              <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-bold capitalize leading-none">
                        {planName}
                    </h3>
                    {isTrialing && (
                       <span className="text-xs uppercase font-bold tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                         Free Trial
                       </span>
                    )}
                    {isCanceled && (
                       <span className="text-xs uppercase font-bold tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                         Canceled
                       </span>
                    )}
                  </div>
                  
                  {isTrialing && (
                      <span className="text-sm font-medium text-slate-400 mt-1">
                        {trialDays} {trialDays === 1 ? 'day' : 'days'} left • Ends {trialEndDate}
                      </span>
                  )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className={`w-4 h-4 ${isTrialing ? 'text-emerald-500' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Status: <span className={`${isTrialing ? 'text-emerald-500' : 'text-blue-500'} font-semibold capitalize`}>
              {status} {isTrialing && trialEndDate ? `(Ends ${trialEndDate})` : ''}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/pricing')}
              className="px-6 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
            >
              Change Plan
            </button>
            <button 
              onClick={handleCancelSubscription}
              className="px-6 py-3 bg-slate-800 hover:bg-red-500/10 hover:text-red-500 text-white font-bold rounded-xl transition-all border border-slate-700"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-surface/30 border border-dashed border-slate-800 rounded-2xl p-6">
        <h4 className="font-semibold mb-2 text-white">Need a custom plan?</h4>
        <p className="text-sm text-slate-400 mb-4">We offer tailored solutions for large-scale operations with dedicated support and unlimited throughput.</p>
        <button 
          onClick={() => navigate('/about')}
          className="text-primary font-bold hover:underline text-sm uppercase tracking-wider"
        >
          Contact Enterprise Sales
        </button>
      </div>
    </div>
  );
}

export default ManageSubscription;
