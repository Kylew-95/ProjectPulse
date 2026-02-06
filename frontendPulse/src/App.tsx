import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Demo from './pages/landing/Demo';
import Home from './pages/landing/Home';
import { Login, Signup } from './pages/auth/Auth';
import Pricing from './pages/landing/Pricing';
import Overview from './pages/Dashboard/Overview';
import Settings from './pages/Dashboard/Settings';
import Tickets from './pages/Dashboard/Tickets';
import Analytics from './pages/Dashboard/Analytics';
import KnowledgeBase from './pages/Dashboard/KnowledgeBase';
import Team from './pages/Dashboard/Team';


function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/pricing" element={
              <ProtectedRoute>
                <Pricing />
              </ProtectedRoute>
            } />
            
            {/* Dashboard Routes protected by Layout and ProtectedRoute */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
               <Route index element={<Navigate to="overview" replace />} />
               <Route path="overview" element={<Overview />} />
               <Route path="tickets" element={<Tickets />} />
               <Route path="analytics" element={<Analytics />} />
               <Route path="knowledge-base" element={<KnowledgeBase />} />
               <Route path="team" element={<Team />} />
               <Route path="team/:teamId" element={<Team />} />
               <Route path="settings" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
