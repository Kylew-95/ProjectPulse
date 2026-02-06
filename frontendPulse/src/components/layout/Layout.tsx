import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, BarChart2, Settings, Users, LogOut, Book, Lock } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import SidebarProfile from './SidebarProfile';
import ThemeToggle from '../ui/ThemeToggle';
import CommandPalette from '../ui/CommandPalette';
import OnboardingTour from '../ui/OnboardingTour';
import DiscordChat from '../ui/DiscordChat';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { useGlobalShortcuts } from '../../hooks/useKeyboardShortcuts';
import ShortcutHelpModal from '../common/ShortcutHelpModal';

const Layout = () => {
    const location = useLocation();
    const { profile } = useAuth();
    const { showHelp, setShowHelp } = useGlobalShortcuts();
    
  
    const handleLogout = async () => {
      await supabase.auth.signOut();
    };
  
    const navItems = [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/overview' },
      { icon: Users, label: 'Teams', path: '/dashboard/team' },
      { icon: Ticket, label: 'Tickets', path: '/dashboard/tickets' },
      { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics', isEnterprise: true },
      { icon: Book, label: 'Knowledge Base', path: '/dashboard/knowledge-base', isEnterprise: true },
      { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    ];

    const isEnterprise = ['enterprise', 'super_admin'].includes(profile?.subscription_tier || '');
  
    return (
      <div className="flex min-h-screen bg-background transition-colors duration-300">
        <OnboardingTour />
        <CommandPalette />
        <DiscordChat />
        <ShortcutHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        
        {/* Sidebar */}
        <aside 
            className="w-[260px] flex-shrink-0 fixed h-full z-20 flex flex-col border-r transition-all duration-300 bg-surface border-border-main"
        >
            {/* Logo Area */}
            <div className="p-5 flex items-center gap-3">
                <Link to="/" className="flex items-center gap-3 group" title="Return to home">
                    <img src="/logo.png" alt="Pulse Loop" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
                    <span className="text-xl font-bold tracking-tight text-main">
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
                                            : 'text-muted hover:bg-surface/50 hover:text-main'
                                    }`}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-md" />
                                    )}
                                    
                                    <Icon 
                                        size={20} 
                                        className={`sidebar-icon-animate transition-colors ${
                                            isActive 
                                                ? 'text-blue-600 dark:text-blue-400' 
                                                : 'text-muted group-hover:text-main'
                                        }`} 
                                    />
                                    <span>{item.label}</span>
                                    {item.isEnterprise && !isEnterprise && (
                                        <Lock size={12} className="ml-auto text-slate-400 opacity-60" />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
  
            {/* Footer / Profile */}
            <div className="p-3 border-t border-border-main bg-background/50">
                <SidebarProfile />
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 mt-1 text-sm font-semibold text-muted rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-200"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
  
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col ml-[260px] min-w-0">
            {/* Header / Topbar */}
            <header className="sticky top-0 z-10 w-full h-16 flex items-center justify-end px-8 bg-surface/80 backdrop-blur-md border-b border-border-main gap-4">
                <NotificationDropdown />
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
