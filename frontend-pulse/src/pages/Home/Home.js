import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function Home() {
  const navigate = useNavigate();
  const [activeUsers, setActiveUsers] = useState(0);
  const [ticketsSatisfied, setTicketsSatisfied] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch Active Users (distinct user_ids from messages)
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('user_id');
        
        if (!msgError && messages) {
          const uniqueUsers = new Set(messages.map(m => m.user_id));
          setActiveUsers(uniqueUsers.size);
        }

        // Fetch Tickets Satisfied (count of tickets table)
        const { count, error: ticketError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true });
        
        if (!ticketError) {
          setTicketsSatisfied(count || 0);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="border-b border-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg shadow-lg shadow-primary/20"></div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Pulse
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <button 
              onClick={() => navigate('/onboarding')}
              className="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-slate-700 text-xs font-medium text-primary mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            v1.0 is now live
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
            Manage projects with <br />
            <span className="text-primary">pulse and precision.</span>
          </h2>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Streamline your workflow, collaborate in real-time, and ship faster with ProjectPulse. 
            The all-in-one workspace for modern engineering teams.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-primary hover:bg-blue-600 text-white font-semibold rounded-xl shadow-xl shadow-primary/20 transition-all duration-200 hover:-translate-y-1"
            >
              Start Building Free
            </button>
            <button className="px-8 py-4 bg-surface hover:bg-slate-800 text-white font-semibold rounded-xl border border-slate-700 transition-all duration-200 hover:-translate-y-1">
              View Demo
            </button>
          </div>
        </div>

        {/* Stats / Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
             <div className="p-4 rounded-xl bg-surface/50 border border-slate-800 hover:border-slate-700 transition-colors group">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Active Users</h3>
                <div className="text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{activeUsers}</div>
             </div>
             <div className="p-4 rounded-xl bg-surface/50 border border-slate-800 hover:border-slate-700 transition-colors group">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Tickets Satisfied</h3>
                <div className="text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{ticketsSatisfied}</div>
             </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface/50 bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} ProjectPulse. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="https://www.linkedin.com/in/kyle-williams-4a7793200/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="https://github.com/Kylew-95" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
