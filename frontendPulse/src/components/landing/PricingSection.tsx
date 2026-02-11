import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check, Rocket, Shield, Zap, AlertCircle, X, ArrowDownCircle } from 'lucide-react';

// ... (previous code)

import { getApiUrl } from '../../utils/apiConfig';
import Button from '../ui/Button';
import Container from '../ui/Container';

interface Plan {
  id: string;
  name: string;
  tier: string;
  price: string;
  priceId: string;
  period: string;
  features: string[];
  isEnterprise: boolean;
}

const PricingSection = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [errorModal, setErrorModal] = useState<{ 
    isOpen: boolean; 
    message: string;
    title?: string;
    type?: 'restriction' | 'duplicate' | 'downgrade'
  }>({
    isOpen: false,
    message: '',
    title: 'Subscription Restriction'
  });

  const [pendingDowngrade, setPendingDowngrade] = useState<Plan | null>(null);

  const PLAN_HIERARCHY = {
    'starter': 1,
    'pro': 2,
    'enterprise': 3
  };

  // Plans are now static for performance and to avoid loading flashes
  const plans: Plan[] = [
    {
      id: 'prod_TwvEIYfyxhTLh9',
      name: 'Starter',
      tier: 'starter',
      price: '£18',
      period: '/mo + VAT',
      priceId: 'price_1Sz1OJK4HSIkuH8Ohizm81wU',
      isEnterprise: false,
      features: [
        '2,000 Tickets per month',
        'Real-time team collaboration',
        'Standard analytics dashboard',
        'Discord & Email notifications',
        'Community-led technical support'
      ]
    },
    {
      id: 'prod_TwvElJQlmqjtiG',
      name: 'Pro',
      tier: 'pro',
      price: '£24',
      period: '/mo + VAT',
      priceId: 'price_1Sz1OKK4HSIkuH8OwHVYNROe',
      isEnterprise: false,
      features: [
        '10,000 Tickets per month',
        'Bi-directional Jira & GitHub sync',
        'Advanced AI Status Reports',
        'Multi-team workspace management',
        '8/5 Priority engineer support'
      ]
    },
    {
      id: 'prod_TwvENEvu7UH03I',
      name: 'Enterprise',
      tier: 'enterprise',
      price: '£120',
      period: '/mo + VAT',
      priceId: 'price_1Sz1OLK4HSIkuH8OFtFigz4W',
      isEnterprise: true,
      features: [
        'Unlimited scale & data retention',
        'Custom-trained LLM for your team',
        'SOC2 & Audit Log compliance',
        'Dedicated Success Architect',
        '99.9% Uptime SLA Guarantee'
      ]
    }
  ];

  const getPlanDescription = (name: string) => {
    if (name === 'Starter') return "Establish your team's presence with essential project tracking and unified communication.";
    if (name === 'Pro') return 'Accelerate delivery with complex automation and cross-platform synchronization.';
    if (name === 'Enterprise') return 'Institutional-grade governance and bespoke AI models for global scale.';
    return '';
  };

  const getFeatures = (name: string) => {
      if (name === 'Starter') return [
        '2,000 Operations per month',
        'Real-time team collaboration',
        'Standard analytics dashboard',
        'Discord & Email notifications',
        'Community-led technical support'
      ];
      if (name === 'Pro') return [
        '10,000 Operations per month',
        'Bi-directional Jira & GitHub sync',
        'Advanced AI Status Reports',
        'Multi-team workspace management',
        '8/5 Priority engineer support'
      ];
      if (name === 'Enterprise') return [
        'Unlimited scale & data retention',
        'Custom-trained LLM for your team',
        'SOC2 & Audit Log compliance',
        'Dedicated Success Architect',
        '99.9% Uptime SLA Guarantee'
      ];
      return [];
  };

  const [isSubscribing, setIsSubscribing] = useState(false);

  const proceedWithDowngrade = () => {
    if (pendingDowngrade) {
      setErrorModal({ ...errorModal, isOpen: false });
      handleSubscribe(pendingDowngrade, true); // Pass true to bypass checks
      setPendingDowngrade(null);
    }
  };

  const handleSubscribe = async (plan: Plan, bypassChecks = false) => {
    if (!user) {
      localStorage.setItem('checkout_priceId', plan.priceId);
      navigate('/login');
      return;
    }

    if (!bypassChecks) {
        // Proactive check for existing plan
        if (profile && profile.status === 'active') {
          if (profile.subscription_tier === plan.tier) {
            setErrorModal({
              isOpen: true,
              title: 'Already Subscribed',
              message: `You are already on the ${plan.name} plan. Please choose a different plan or visit your billing portal to manage your subscription.`,
              type: 'duplicate'
            });
            return;
          }

          // Check for downgrade
          const currentTierKey = profile.subscription_tier?.toLowerCase() as keyof typeof PLAN_HIERARCHY;
          const newTierKey = plan.tier?.toLowerCase() as keyof typeof PLAN_HIERARCHY;
          
          const currentTierLevel = PLAN_HIERARCHY[currentTierKey] || 0;
          const newTierLevel = PLAN_HIERARCHY[newTierKey] || 0;

          if (newTierLevel < currentTierLevel) {
            setPendingDowngrade(plan);
            setErrorModal({
              isOpen: true,
              title: 'Confirm Downgrade',
              message: `Are you sure you want to switch to the ${plan.name} plan? You may lose access to advanced features immediately.`,
              type: 'downgrade'
            });
            return;
          }
        }
    }

    setIsSubscribing(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: plan.priceId,
          user_id: user?.id,
          email: user?.email
        }),
      });

      if (response.status === 403) {
        const data = await response.json();
        setErrorModal({
          isOpen: true,
          title: 'Subscription Restriction',
          message: data.detail || 'Plan changes are restricted to once every 30 days.',
          type: 'restriction'
        });
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <Container className="pt-8 sm:pt-12 pb-24 relative px-4" id="pricing">
      {/* Error Modal */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
              errorModal.type === 'duplicate' ? 'bg-blue-500/10 text-blue-500' : errorModal.type === 'downgrade' ? 'bg-orange-500/10 text-orange-500' : 'bg-amber-500/10 text-amber-500'
            }`}>
              {errorModal.type === 'duplicate' ? <Rocket size={24} /> : errorModal.type === 'downgrade' ? <ArrowDownCircle size={24} /> : <AlertCircle size={24} />}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              {errorModal.title || 'Subscription Restriction'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              {errorModal.message}
            </p>
            <Button 
              onClick={() => {
                  if (errorModal.type === 'downgrade') {
                      proceedWithDowngrade();
                  } else {
                      setErrorModal({ ...errorModal, isOpen: false });
                  }
              }}
              className="w-full py-4 text-sm font-bold uppercase tracking-widest rounded-2xl"
              variant="primary"
            >
              {errorModal.type === 'duplicate' ? 'Choose Different Plan' : errorModal.type === 'downgrade' ? 'Yes, I\'m sure' : 'Acknowledge'}
            </Button>
          </div>
        </div>
      )}

      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>

      <div className="text-center max-w-4xl mx-auto mb-20 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-5xl sm:text-7xl font-black mb-6 tracking-tighter text-slate-900 dark:text-white leading-tight">
          Pricing
        </h2>
        <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed mb-4">
          Easy. Flexible. <br />
          <span className="text-primary underline decoration-primary/30 underline-offset-8 italic">No lock-ins. No hidden fees.</span>
          <br />
          <span className="text-[10px] text-slate-400 mt-2 block opacity-30 uppercase tracking-[0.3em] font-black">All prices exclude applicable VAT</span>
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative z-10 w-full max-w-7xl mx-auto items-stretch">
        {plans.map((plan, index) => (
          <div 
            key={plan.name} 
            className={`group relative flex flex-col p-10 bg-white dark:bg-slate-900 border transition-all duration-500 rounded-[2.5rem] h-full ${
                plan.name === 'Pro' 
                ? 'border-primary ring-8 ring-primary/5 shadow-[0_20px_50px_-20px_rgba(59,130,246,0.3)] z-20 scale-105' 
                : 'border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
             
             {plan.name === 'Pro' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-6 py-1.5 rounded-full shadow-lg tracking-widest uppercase z-30">
                      Most Popular
                  </div>
             )}

             <div className="mb-10">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">{plan.name}</h3>
                 <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors">
                    {plan.name === 'Starter' && <Zap size={18} />}
                    {plan.name === 'Pro' && <Rocket size={18} />}
                    {plan.name === 'Enterprise' && <Shield size={18} />}
                 </div>
               </div>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6 h-10">
                 {getPlanDescription(plan.name)}
               </p>
               <div className="flex flex-col">
                 <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{plan.price}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{plan.period}</span>
                 </div>
               </div>
             </div>

             <div className="h-px bg-slate-100 dark:bg-white/5 w-full mb-10"></div>

             <ul className="space-y-5 mb-12 flex-1">
               {(plan.features.length ? plan.features : getFeatures(plan.name)).map((f: string) => (
                 <li key={f} className="flex items-start gap-4 text-slate-600 dark:text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <Check size={12} strokeWidth={4} />
                    </div>
                    <span className="text-sm font-bold tracking-tight leading-snug">{f}</span>
                 </li>
               ))}
             </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                loading={isSubscribing}
                disabled={profile?.status === 'active' && profile?.subscription_tier === plan.tier}
                variant={plan.name === 'Pro' ? 'primary' : 'secondary'}
                className={`w-full py-5 text-sm font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 ${
                    plan.name === 'Pro' 
                    ? 'hover:shadow-[0_10px_30px_-15px_rgba(59,130,246,0.5)]' 
                    : 'bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                } ${
                  profile?.status === 'active' && profile?.subscription_tier === plan.tier
                  ? 'opacity-50 cursor-not-allowed grayscale'
                  : ''
                }`}
              >
                {
                  profile?.status === 'active' && profile?.subscription_tier === plan.tier 
                  ? 'Current Plan'
                  : (plan.name === 'Pro' ? 'Get Started Now' : 'Choose Plan')
                }
              </Button>
          </div>
        ))}
      </div>

      <div className="mt-24 text-center flex flex-col items-center gap-6">
        <div className="flex items-center gap-12 saturate-0 opacity-20 grayscale hover:opacity-100 transition-opacity duration-500">
            <Shield size={24} />
            <Zap size={24} />
            <Rocket size={24} />
        </div>
        <div className="flex flex-col items-center gap-2">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold tracking-[0.2em] uppercase">
                Secure enterprise-grade payments via <span className="text-slate-900 dark:text-slate-200">Stripe</span>
            </p>
            <div className="flex gap-2 text-[10px] text-slate-400">
                <span>PCI DSS Compliant</span>
                <span>•</span>
                <span>256-bit Encryption</span>
            </div>
        </div>
      </div>
    </Container>
  );
};

export default PricingSection;
