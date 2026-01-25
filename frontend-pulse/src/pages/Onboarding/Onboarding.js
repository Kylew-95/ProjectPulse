import { useNavigate } from 'react-router-dom';
// Onboarding currently doesn't use supabaseClient, but Home/Pricing do.
// I'll check Pricing next.

function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-white font-sans flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Welcome to Pulse
        </h1>
        <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg mx-auto">
          We're excited to help you manage your projects with precision. 
          Let's get you set up with the perfect plan for your needs.
        </p>
        
        <div className="bg-surface/50 border border-slate-800 rounded-2xl p-8 mb-10 text-left">
          <h2 className="text-xl font-semibold mb-4">What brings you here?</h2>
          <div className="space-y-3">
            {['Scaling Enterprise Operations', 'Accelerating Team Growth', 'Streamlining Customer Support'].map((option) => (
              <label key={option} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-slate-700">
                <input type="radio" name="goal" className="w-5 h-5 text-primary bg-transparent border-slate-600 focus:ring-primary focus:ring-offset-0" />
                <span className="text-slate-300">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-primary hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-1 w-full sm:w-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default Onboarding;
