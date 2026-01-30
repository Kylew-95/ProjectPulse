import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const InteractivePulse = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const textRef = useRef<HTMLSpanElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement>) => {
        if (!textRef.current) return;
        const rect = textRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <span 
            ref={textRef}
            onMouseMove={handleMouseMove}
            className="relative inline-block text-transparent bg-clip-text font-extrabold cursor-default transition-colors duration-300 select-none pb-2"
            style={{
                backgroundImage: `radial-gradient(circle at ${position.x}px ${position.y}px, #2563eb 0%, #3b82f6 25%, #60a5fa 50%, #94a3b8 100%)`,
                backgroundSize: '150% 150%',
                backgroundPosition: 'center',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
            }}
        >
            Pulse
        </span>
    );
};

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Automatically redirect logged-in users to the dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-slate-900 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Pulse Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-white tracking-tight">
              Pulse
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-slate-200 transition-colors">Dashboard</button>
            ) : (
                <>
                    <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</button>
                    <button onClick={() => navigate('/signup')} className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-slate-200 transition-colors">Get Started</button>
                </>
            )}
        </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-20 pb-8 sm:pt-32 sm:pb-12 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-blue-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            v2.0 is now live
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            The heart of a business needs a <InteractivePulse />
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Streamline your workflow, manage tickets efficiently, and get real-time insights into your team's performance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <button onClick={() => navigate(user ? '/dashboard' : '/signup')} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 group">
              {user ? 'Go to Dashboard' : 'Start for free'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/demo')} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-blue-400 rounded-full font-semibold transition-all backdrop-blur-xl border border-blue-500/10">
              View Demo
            </button>
          </div>
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
         <div className="grid md:grid-cols-3 gap-8">
            {[
                { icon: Zap, title: "Real-time Sync", desc: "Updates happen instantly across all devices." },
                { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption for your data." },
                { icon: Globe, title: "Global CDN", desc: "Lightning fast access from anywhere." }
            ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/10 border border-white/10 hover:border-blue-500/30 transition-colors group backdrop-blur-sm text-white">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                        <feature.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-slate-400">{feature.desc}</p>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Home;
