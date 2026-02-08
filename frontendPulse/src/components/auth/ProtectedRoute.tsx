import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HeartbeatLoader from '../ui/HeartbeatLoader';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const isSuccess = query.get('success') === 'true' || !!query.get('session_id');
  const [minLoading, setMinLoading] = React.useState(true);

  // Enforce minimum loading time of 2 seconds for better UX
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Safety Reminder: If profile is missing but session exists, we just wait.
  // Webhooks can sometimes take a few seconds to propagate.
  const [showRetry, setShowRetry] = React.useState(false);
  React.useEffect(() => {
    if (session && !profile) {
      const timer = setTimeout(() => {
        setShowRetry(true);
      }, 15000); // Show retry notice after 15 seconds
      return () => clearTimeout(timer);
    }
  }, [session, profile]);

  // If returning from Stripe successfully, poll for status update
  React.useEffect(() => {
    // Check trial validity for reload logic too
    const isTrialActive = profile?.trial_end ? new Date(profile.trial_end) > new Date() : false;
    if (isSuccess && profile?.status !== 'active' && profile?.status !== 'trialing' && !isTrialActive) {
         const interval = setInterval(async () => {
             // Use context refreshProfile to update state without reloading page
             await refreshProfile();
         }, 5000);
         return () => clearInterval(interval);
    }
  }, [isSuccess, profile, refreshProfile]);

  if (loading || (session && !profile) || minLoading) {
    return <HeartbeatLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const isTrialActive = profile?.trial_end ? new Date(profile.trial_end) > new Date() : false;
  const isPaid = ['active', 'trialing'].includes(profile?.status || '') || isTrialActive || profile?.subscription_tier === 'super_admin';
  const isPricingPage = location.pathname === '/pricing';

  if (!isPaid && !isPricingPage) {
      if (isSuccess) {
          // Show loading state while waiting for webhook
          return (
            <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 text-center">
                <HeartbeatLoader />
                <h2 className="text-xl font-bold mt-4">Verifying Subscription...</h2>
                <p className="text-slate-400 max-w-xs mt-2">Please wait while we confirm your payment. This usually takes a few seconds.</p>
                {showRetry && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    Taking a while? Click to refresh
                  </button>
                )}
            </div>
          );
      }
    return <Navigate to="/pricing" replace />;
  }

  return children as React.ReactElement;
};

export default ProtectedRoute;
