import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, BarChart2, Settings, Users, LogOut } from 'lucide-react';

import { supabase } from '../../supabaseClient';
import SidebarProfile from './SidebarProfile';
import CommandPalette from '../ui/CommandPalette';
import OnboardingTour from '../ui/OnboardingTour';

const Layout = () => {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/overview' },
    { icon: Users, label: 'Team', path: '/dashboard/team' },
    { icon: Ticket, label: 'Tickets', path: '/dashboard/tickets' },
    { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-background text-white selection:bg-primary/30 scroll-smooth">
      <OnboardingTour />
      <CommandPalette />
      {/* Sidebar - Glassmorphism */}
      <aside className="w-64 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col fixed inset-y-0 z-50 transition-all duration-300">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/src/assets/logo.png" alt="Pulse Logo" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-bold text-white tracking-tight">
              Pulse
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-primary/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} className={`relative z-10 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="relative z-10 font-medium">{item.label}</span>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-primary rounded-r-full shadow-[0_0_10px_currentColor]"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-900/30">
          <SidebarProfile />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200 group mt-1"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-y-auto bg-background p-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
