import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import DashboardOverview from './pages/Dashboard/Overview';
import TicketsPage from './pages/Dashboard/TicketsPage';
import AnalyticsPage from './pages/Dashboard/AnalyticsPage';
import TeamPage from './pages/Dashboard/TeamPage';
import SettingsPage from './pages/Dashboard/SettingsPage';
import ManageSubscription from './pages/Dashboard/ManageSubscription';
import Onboarding from './pages/Onboarding/Onboarding';
import Pricing from './pages/Pricing/Pricing';
import About from './pages/About/About';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './supabaseClient';
import { AuthProvider, useAuth } from './context/AuthContext';

function AuthHandler({ children }) {
  const { session, profile, loading, profileLoading, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Effect 1: Polling Logic for Payment Success
  useEffect(() => {
    // Only poll if we have success param AND potentially missing plan
    // We check profile directly inside interval to be safe, but triggering relies on this state
    const shouldPoll = window.location.search.includes('success=true') && !profile?.subscription_tier;
    
    if (shouldPoll) {
        setIsProcessing(true);
        const interval = setInterval(() => {
            console.log('Polling for subscription update...');
            refreshProfile();
        }, 2000);
        return () => clearInterval(interval);
    } else {
        setIsProcessing(false);
    }
  }, [profile, refreshProfile]);

  // Effect 2: Authentication Redirects
  useEffect(() => {
    if (loading || profileLoading) return;

    const path = window.location.pathname;
    const authPages = ['/login', '/signup']; 
    const publicPages = ['/pricing', '/about', '/'];
    
    // Debug logging
    console.log('AuthHandler Debug:', { 
      path, 
      user: session?.user?.email, 
      plan: profile?.subscription_tier, 
      profileLoading 
    });

    // Redirect logged-in users away from auth pages
    if (session?.user && authPages.includes(path)) {
      console.log('Redirecting to dashboard (auth page check)');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Force plan selection for users without a plan
    if (session?.user && !profile?.subscription_tier && !publicPages.includes(path)) {
       console.log('Redirecting to pricing (no plan check)');
       navigate('/pricing', { replace: true });
       return;
    }
  }, [session, profile, loading, profileLoading, navigate, location]);

  if (loading || profileLoading) return null; // Or loading spinner

  if (isProcessing) {
      return (
          <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <h2 className="text-xl font-bold text-white mb-2">Confirming Subscription...</h2>
              <p className="text-slate-400">Please wait while we verify your payment.</p>
          </div>
      );
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthHandler>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardOverview />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/subscription" element={<ManageSubscription />} />
            </Route>
          </Routes>
        </AuthHandler>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
