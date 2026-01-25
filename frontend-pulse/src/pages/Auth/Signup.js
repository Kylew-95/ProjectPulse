import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function Signup() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || localStorage.getItem('subscription_tier') || 'free_trial';
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleDiscordSignup = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin + '/onboarding',
      },
    });
    if (error) {
      console.error('Error signing up with Discord:', error.message);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg shadow-lg shadow-primary/20 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-sm text-slate-400">
            Get started with our <span className="text-primary font-semibold">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span> plan.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center font-medium animate-pulse">
            {error === 'Unsupported provider: provider is not enabled' 
              ? 'Discord login is not yet enabled in the backend.' 
              : error}
          </div>
        )}

        <div className="space-y-6">
          <button 
            onClick={handleDiscordSignup}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.5151.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
            </svg>
            Sign up with Discord
          </button>

          <p className="text-xs text-center text-slate-500 px-6">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm">
          <span className="text-slate-400">Already have an account? </span>
          <button 
            onClick={() => navigate('/login')}
            className="text-primary hover:text-blue-400 font-medium transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;
