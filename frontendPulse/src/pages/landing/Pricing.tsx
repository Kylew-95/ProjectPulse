import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import PricingSection from '../../components/landing/PricingSection';

const Pricing = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`${theme} min-h-screen bg-background text-main flex flex-col items-center relative overflow-hidden transition-colors duration-300`}>
      {/* Navigation */}
      <div className="absolute top-8 left-4 sm:left-8 z-50">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 dark:bg-white/5 hover:bg-slate-900/100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-full text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group backdrop-blur-md"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Home
        </button>
      </div>

      <PricingSection />
    </div>
  );
};

export default Pricing;
