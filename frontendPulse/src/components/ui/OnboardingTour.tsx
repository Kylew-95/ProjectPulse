import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Sparkles, LayoutDashboard, Users, Ticket, Settings } from 'lucide-react';

const steps = [
  {
    title: "Welcome to Pulse",
    description: "Your ultimate hub for project management and team collaboration. Let's take a quick 1-minute tour.",
    icon: <Sparkles className="text-amber-400" size={32} />,
    target: "sidebar-logo"
  },
  {
    title: "Project Overview",
    description: "Get a high-level view of your project's health, active tickets, and team performance at a glance.",
    icon: <LayoutDashboard className="text-primary" size={32} />,
    target: "nav-overview"
  },
  {
    title: "Team Management",
    description: "Invite team members, assign roles, and manage permissions from the Team center.",
    icon: <Users className="text-purple-400" size={32} />,
    target: "nav-team"
  },
  {
    title: "Ticket Intelligence",
    description: "Manage tasks across services, use real-time filters, and export your data with ease.",
    icon: <Ticket className="text-emerald-400" size={32} />,
    target: "nav-tickets"
  },
  {
    title: "Ready to Start?",
    description: "You're all set! Head over to Settings to configure your integrations or jump straight into work.",
    icon: <Settings className="text-slate-400" size={32} />,
    target: "nav-settings"
  }
];

const OnboardingTour = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('pulse_onboarding_completed');
    if (!hasCompletedTour) {
      // Small delay to ensure layout is ready
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    localStorage.setItem('pulse_onboarding_completed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-auto"
            onClick={completeTour}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-slate-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl pointer-events-auto overflow-hidden group"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700" />
            
            <button 
              onClick={completeTour}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <motion.div 
                key={currentStep}
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/5"
              >
                {steps[currentStep].icon}
              </motion.div>

              <h3 className="text-xl font-bold text-white mb-2">{steps[currentStep].title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                {steps[currentStep].description}
              </p>

              <div className="flex items-center justify-between w-full">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-primary' : 'w-1.5 bg-white/10'}`} 
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                >
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next Step'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
