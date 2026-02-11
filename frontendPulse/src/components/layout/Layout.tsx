import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, BarChart2, Settings, Users, LogOut, Book, Lock, Menu, X as CloseIcon, Sparkles } from 'lucide-react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change without triggering useEffect cascading render lint
    const [prevPath, setPrevPath] = useState(location.pathname);
    if (location.pathname !== prevPath) {
        setPrevPath(location.pathname);
        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    }
  
    const handleLogout = async () => {
      await supabase.auth.signOut();
    };
  
    const navItems = [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/overview' },
      { icon: Users, label: 'Teams', path: '/dashboard/team' },
      { icon: Ticket, label: 'Tickets', path: '/dashboard/tickets' },
      { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics', isEnterprise: true },
      { icon: Sparkles, label: 'AI Workspace', path: '/dashboard/ai-workspace', isEnterprise: true },
      { icon: Book, label: 'Knowledge Base', path: '/dashboard/knowledge-base', isEnterprise: true },

      { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    ];

    const isSuperAdmin = profile?.subscription_tier?.toLowerCase() === 'super_admin';
    const isEnterprise = (profile?.subscription_tier === 'enterprise') || isSuperAdmin;
    const isPro = ['pro', 'enterprise'].includes(profile?.subscription_tier || '') || isSuperAdmin;
  
    return (
      <div className="flex min-h-screen bg-background transition-colors duration-300 relative">
        <OnboardingTour />
        <CommandPalette />
        <DiscordChat />
        <ShortcutHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
            />
        )}

        {/* Sidebar */}
        <aside 
            className={`w-[260px] flex-shrink-0 fixed h-full z-40 flex flex-col border-r transition-all duration-300 bg-surface border-border-main lg:translate-x-0 ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            {/* Logo Area */}
            <div className="p-5 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group" title="Return to home">
                    <img src="/logo.png" alt="Pulse Loop" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
                    <span className="text-xl font-bold tracking-tight text-main">
                         Pulse
                    </span>
                </Link>
                <button 
                    className="lg:hidden p-2 text-muted hover:text-main"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <CloseIcon size={20} />
                </button>
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
                                    {item.label === 'Analytics' ? (
                                        !isPro && <Lock size={12} className="ml-auto text-slate-400 opacity-60" />
                                    ) : item.label === 'AI Workspace' ? (
                                        !(isEnterprise || profile?.addons?.includes('ai_workspace')) && <Lock size={12} className="ml-auto text-slate-400 opacity-60" />
                                    ) : item.isEnterprise && !isEnterprise && (
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
        <div className="flex-1 flex flex-col lg:ml-[260px] min-w-0">
            {/* Header / Topbar */}
            <header className="sticky top-0 z-10 w-full h-16 flex items-center justify-between lg:justify-end px-4 md:px-8 bg-surface/80 backdrop-blur-md border-b border-border-main gap-4">
                <button 
                    className="lg:hidden p-2 -ml-2 text-muted hover:text-main"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2 md:gap-4">
                    <NotificationDropdown />
                    <ThemeToggle />
                </div>
            </header>
  
            <main className="flex-1 p-4 md:p-8 pt-6">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
      </div>
    );
};
  
export default Layout;
