import { Link, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserMenu from '../../components/UserMenu';

function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', path: '/dashboard', end: true },
    { label: 'Tickets', path: '/dashboard/tickets' },
    { label: 'Analytics', path: '/dashboard/analytics' },
    { label: 'Team', path: '/dashboard/team' },
    { label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-background text-white font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-surface/50 bg-surface/30 backdrop-blur-md hidden md:flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg shadow-lg shadow-primary/20"></div>
            <span className="text-lg font-bold tracking-tight">ProjectPulse</span>
          </Link>
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.label} 
                to={item.path}
                end={item.end}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-surface/50 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm z-50 shrink-0">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
