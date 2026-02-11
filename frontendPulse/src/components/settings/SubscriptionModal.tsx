import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ExternalLink, AlertCircle, Rocket, ArrowDownCircle } from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../../types/auth';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  profile: Profile | null;
}

interface ModalPlan {
  name: string;
  tier?: string;
  price: string;
  period: string;
  features: string[];
  active: boolean;
  priceId: string;
  isEnterprise: boolean;
}

interface StripeProduct {
  id: string;
  name: string;
  price: number;
  price_id: string;
  description: string | null;
  metadata?: {
    plan_tier_id?: string;
    addon_key?: string;
  };
}

const SubscriptionModal = ({ isOpen, onClose, user, profile }: SubscriptionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<ModalPlan[]>([]);
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

  const [pendingDowngrade, setPendingDowngrade] = useState<(ModalPlan & { tier?: string }) | null>(null);

  const PLAN_HIERARCHY = {
    'starter': 1,
    'pro': 2,
    'enterprise': 3
  };

  const getFeatures = (name: string) => {
      if (name === 'Starter') return [
        '2,000 Tickets per month',
        'Real-time team collaboration',
        'Standard analytics dashboard',
        'Discord & Email notifications',
        'Community-led technical support'
      ];
      if (name === 'Pro') return [
        '10,000 Tickets per month',
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

  useEffect(() => {
    if (isOpen) {
        const fetchPlans = async () => {
        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/billing/products`);
            if (res.ok) {
            const data: StripeProduct[] = await res.json();
            // Sort by price and filter out add-ons
            const formatted: ModalPlan[] = data
                .filter((p: StripeProduct) => !p.metadata?.addon_key) // Hide Add-ons from plan list
                .sort((a, b) => a.price - b.price)
                .map((p) => ({
                name: p.name,
                tier: p.metadata?.plan_tier_id || p.name.toLowerCase(),
                price: `£${p.price}`,
                period: '/mo + VAT',
                features: getFeatures(p.name),
                active: profile?.subscription_tier === p.metadata?.plan_tier_id || (p.name === 'Starter' && !profile?.subscription_tier),
                priceId: p.price_id,
                isEnterprise: p.name === 'Enterprise'
            }));
            setPlans(formatted);
            }
        } catch (e) {
            const error = e as Error;
            console.error("Failed to fetch plans", error);
        }
        };
        fetchPlans();
    }
  }, [isOpen, profile]);

  const proceedWithDowngrade = () => {
    if (pendingDowngrade) {
      setErrorModal({ ...errorModal, isOpen: false });
      handleSubscribe(pendingDowngrade, true);
      setPendingDowngrade(null);
    }
  };

  const handleSubscribe = async (plan: ModalPlan & { tier?: string }, bypassChecks = false) => {
    if (!bypassChecks) {
        if (plan.active && profile?.status === 'active') {
            setErrorModal({
                isOpen: true,
                title: 'Already Subscribed',
                message: `You are already on the ${plan.name} plan. Please choose a different plan or visit your billing portal to manage your subscription.`,
                type: 'duplicate'
            });
            return;
        }

        // Check for downgrade
        if (profile?.status === 'active' && profile.subscription_tier && plan.tier) {
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

    setLoading(true);
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
      } else {
         console.error('No checkout URL returned', data);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Checkout error:', error);
    } finally {
        setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/billing/create-portal-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user?.email
          }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        const error = err as Error;
        console.error('Portal error:', error);
      } finally {
          setLoading(false);
      }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={onClose}
            />

            {/* Error Modal Overlay */}
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
                            errorModal.type === 'duplicate' ? 'bg-primary/10 text-primary' : errorModal.type === 'downgrade' ? 'bg-orange-500/10 text-orange-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                            {errorModal.type === 'duplicate' ? <Rocket size={24} /> : errorModal.type === 'downgrade' ? <ArrowDownCircle size={24} /> : <AlertCircle className="text-amber-500" size={24} />}
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                            {errorModal.title || 'Subscription Restriction'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                            {errorModal.message}
                        </p>
                        <button 
                            onClick={() => {
                                if (errorModal.type === 'downgrade') {
                                    proceedWithDowngrade();
                                } else {
                                    setErrorModal({ ...errorModal, isOpen: false });
                                }
                            }}
                            className="w-full py-4 text-sm font-bold uppercase tracking-widest rounded-2xl bg-primary text-white hover:bg-primary/90 transition-colors"
                        >
                            {errorModal.type === 'duplicate' ? 'Choose Different Plan' : errorModal.type === 'downgrade' ? 'Yes, I\'m sure' : 'Acknowledge'}
                        </button>
                    </div>
                </div>
            )}

            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 overflow-y-auto shadow-2xl z-10"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Manage Subscription</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Current Plan Status */}
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                        <p className="text-xs text-primary font-black uppercase tracking-widest mb-1">My Current Plan</p>
                        <div className="flex justify-between items-baseline">
                             <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">{profile?.subscription_tier?.toUpperCase() || 'NO PLAN'}</h3>
                             <span className="text-[10px] font-black px-3 py-1 bg-primary/20 text-primary rounded-full uppercase tracking-tighter">{profile?.status?.toUpperCase() || 'INACTIVE'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Available Plans</h3>
                        <span className="text-[10px] text-slate-400 font-bold opacity-50 uppercase tracking-tighter">Prices exclude VAT</span>
                    </div>
                    
                    <div className="space-y-4">
                        {plans.map((plan) => (
                             <div key={plan.name} className={`p-5 rounded-[2rem] border transition-all duration-300 ${
                                 plan.active ? 'border-primary ring-4 ring-primary/5 bg-primary/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 hover:border-slate-300 dark:hover:border-slate-700'
                             }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">{plan.name}</h4>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{plan.price}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{plan.period}</span>
                                        </div>
                                    </div>
                                    {plan.active && <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Check size={14} strokeWidth={4} /></div>}
                                </div>
                                
                                <ul className="space-y-2 mb-6">
                                     {plan.features.slice(0, 3).map((f: string, i: number) => (
                                         <li key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold tracking-tight leading-snug">
                                             <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1 shrink-0"></div> {f}
                                         </li>
                                     ))}
                                     {plan.features.length > 3 && (
                                         <li className="text-[10px] text-slate-600 dark:text-slate-500 font-black uppercase tracking-widest mt-2">+ See full feature list</li>
                                     )}
                                </ul>

                                {plan.active ? (
                                    <button disabled className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest border border-transparent cursor-default">Current Plan</button>
                                ) : (
                                    <button 
                                        onClick={() => handleSubscribe(plan)}
                                        className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg shadow-black/5"
                                    >
                                        {loading ? 'Processing...' : 'Switch to this plan'}
                                    </button>
                                )}
                             </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                         <button 
                            onClick={handlePortal}
                            className="w-full py-4 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-xs font-black uppercase tracking-widest"
                         >
                             Billing Portal <ExternalLink size={14} />
                         </button>
                         <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed font-bold">
                             Securely manage receipts, payment methods, and your subscription tier via <span className="text-slate-900 dark:text-slate-200">Stripe</span>.
                         </p>
                    </div>
                </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
