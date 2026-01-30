import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, BarChart2, Settings, Users, LogOut } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import SidebarProfile from './SidebarProfile';
import ThemeToggle from '../ui/ThemeToggle';
import CommandPalette from '../ui/CommandPalette';
import OnboardingTour from '../ui/OnboardingTour';

const Layout = () => {
    const location = useLocation();
    
  
    const handleLogout = async () => {
      await supabase.auth.signOut();
    };
  
    const navItems = [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/overview' },
      { icon: Users, label: 'Teams', path: '/dashboard/team' },
      { icon: Ticket, label: 'Tickets', path: '/dashboard/tickets' },
      { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    ];
  
    return (
      <div className="flex min-h-screen bg-slate-100 dark:bg-[#0f172a] transition-colors duration-300">
        <OnboardingTour />
        <CommandPalette />
        
        {/* Sidebar */}
        <aside 
            className="w-[260px] flex-shrink-0 fixed h-full z-20 flex flex-col border-r transition-all duration-300 bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5"
        >
            {/* Logo Area */}
            <div className="p-5 flex items-center gap-3">
                <Link to="/" className="flex items-center gap-3 group" title="Return to home">
                    <img src="/logo.png" alt="Pulse Loop" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                         Pulse
                    </span>
                </Link>
            </div>
  
            {/* Navigation */}
            <nav className="flex-1 px-3 mt-4 overflow-y-auto">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                                        isActive 
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-md" />
                                    )}
                                    
                                    <Icon 
                                        size={20} 
                                        className={`transition-colors ${
                                            isActive 
                                                ? 'text-blue-600 dark:text-blue-400' 
                                                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                                        }`} 
                                    />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
  
            {/* Footer / Profile */}
            <div className="p-3 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                <SidebarProfile />
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-200"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
  
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col ml-[260px] min-w-0">
            {/* Header / Topbar */}
            <header className="sticky top-0 z-10 w-full h-16 flex items-center justify-end px-8 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
                <ThemeToggle />
            </header>
  
            <main className="flex-1 p-8 pt-6">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
      </div>
    );
};
  
export default Layout;
