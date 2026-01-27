import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const query = new URLSearchParams(location.search);
  const isSuccess = query.get('success') === 'true';

  // If returning from Stripe successfully, poll for status update
  React.useEffect(() => {
    if (isSuccess && profile?.status !== 'active' && profile?.status !== 'trialing') {
         const interval = setInterval(() => {
             // Force profile refresh logic would be ideal here if exposed from context
             // For now, we rely on AuthContext maybe polling or we reload page?
             // Since AuthContext doesn't expose 'refreshProfile', we can reload user session.
             window.location.reload(); 
         }, 3000); // Reload every 3s to check status
         return () => clearInterval(interval);
    }
  }, [isSuccess, profile]);

  const isPaid = ['active', 'trialing'].includes(profile?.status || '');
  const isPricingPage = location.pathname === '/pricing';

  if (!isPaid && !isPricingPage) {
      if (isSuccess) {
          // Show loading state while waiting for webhook
          return (
            <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <h2 className="text-xl font-bold">Verifying Subscription...</h2>
                <p className="text-slate-400">Please wait while we confirm your payment.</p>
            </div>
          );
      }
    return <Navigate to="/pricing" replace />;
  }

  return children as React.ReactElement;
};

export default ProtectedRoute;
