import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './supabaseClient';
import { AuthProvider, useAuth } from './context/AuthContext';

function AuthHandler({ children }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname;
    const authPages = ['/login', '/signup', '/'];
    
    // Redirect logged-in users away from auth pages (except pricing)
    if (session?.user && authPages.includes(path)) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Special logic for plan syncing after Discord login
    const syncPlan = async () => {
      const localPlan = localStorage.getItem('subscription_tier');
      if (session?.user && localPlan) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            subscription_tier: localPlan,
            updated_at: new Date().toISOString()
          });

        if (!error) {
          localStorage.removeItem('subscription_tier');
          navigate('/onboarding', { replace: true });
        }
      }
    };

    syncPlan();
  }, [session, loading, navigate]);

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
