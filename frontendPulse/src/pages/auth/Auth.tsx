import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

// --- Shared Layout Component ---
const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => {
  return (
    <div className="min-h-screen w-full flex bg-[#020617] lg:bg-white text-white lg:text-slate-900">
      {/* Left Side - Dark Promotional Area (Hidden on Mobile/Tablet) */}
      <div className="hidden lg:flex w-1/2 bg-[#020617] relative overflow-hidden items-center justify-center p-12">
        {/* Background Grid & Effects */}
        <div className="absolute inset-0 bg-grid-white/5 bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-lg text-left">
           <Link to="/" className="inline-flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Pulse Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-white tracking-tight">Pulse</span>
          </Link>
          
          <h1 className="text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Everything you need to build better products.
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            Streamline your workflow with powerful ticket management, real-time tracking, and seamless team collaboration tools designed for modern development.
          </p>
          
        </div>
      </div>

      {/* Right Side - Form Area (Full Width on Mobile/Tablet, Half on Desktop) */}
      <div className="w-full lg:w-1/2 bg-[#020617] lg:bg-white dark:lg:bg-[#0f172a] flex flex-col items-center justify-center p-8 sm:p-12 md:p-24 relative">
         <div className="w-full max-w-sm">
            {/* Mobile Logo (Visible only on Mobile/Tablet) */}
            <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-8 justify-center w-full">
                <img src="/logo.png" alt="Pulse Logo" className="w-10 h-10 object-contain" />
            </Link>

            <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-white lg:text-slate-900 dark:lg:text-white tracking-tight mb-2">{title}</h2>
                <p className="text-slate-400 lg:text-slate-500 dark:lg:text-slate-400">{subtitle}</p>
            </div>

            {children}
         </div>
      </div>
    </div>
  );
};

// --- Login Component ---
export const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate('/dashboard/overview', { replace: true });
  }, [session, navigate]);

  const handleDiscordLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/dashboard/overview` }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Log in to your account" subtitle="Welcome back! Please enter your details.">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 text-sm border border-red-100">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleDiscordLogin}
          disabled={loading}
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold h-12 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
             <Loader2 size={20} className="animate-spin" />
          ) : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-5.42-48.18-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
          )}
          <span>Continue with Discord</span>
        </button>
        
        <p className="text-center mt-8 text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-semibold transition-colors">Sign up for free</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

// --- Signup Component ---
export const Signup = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      if (session) navigate('/dashboard/overview', { replace: true });
    }, [session, navigate]);
  
    const handleDiscordSignup = async () => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'discord',
        options: { redirectTo: `${window.location.origin}/dashboard/overview` }
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    };
  
    return (
      <AuthLayout title="Create an account" subtitle="Start your 7-day free trial. Credit card required.">
        {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 text-sm border border-red-100">
            <AlertCircle size={16} />
            {error}
            </div>
        )}

        <div className="space-y-4">
            <button
            onClick={handleDiscordSignup}
            disabled={loading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold h-12 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
            {loading ? (
                <Loader2 size={20} className="animate-spin" />
            ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-5.42-48.18-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
            )}
            <span>Sign up with Discord</span>
            </button>
            
            <p className="text-center mt-8 text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-semibold transition-colors">Log in</Link>
            </p>
        </div>
      </AuthLayout>
    );
  };
