import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ExternalLink } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
}

const SubscriptionModal = ({ isOpen, onClose, user, profile }: SubscriptionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
        const fetchPlans = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/products`);
            if (res.ok) {
            const data = await res.json();
            // Sort by price
            const formatted = data.sort((a: any, b: any) => a.price - b.price).map((p: any) => ({
                name: p.name,
                price: `£${p.price}`,
                period: '/mo',
                features: p.description ? p.description.split(',') : [],
                active: profile?.subscription_tier === p.metadata?.plan_tier_id || (p.name === 'Starter' && !profile?.subscription_tier),
                priceId: p.price_id,
                isEnterprise: p.name === 'Enterprise'
            }));
            setPlans(formatted);
            }
        } catch (e) {
            console.error("Failed to fetch plans", e);
        }
        };
        fetchPlans();
    }
  }, [isOpen, profile]);

  const getFeatures = (name: string) => {
      if (name === 'Starter') return ['Up to 3 projects', 'Basic analytics', 'Community support'];
      if (name === 'Pro') return ['Unlimited projects', 'Advanced analytics', 'Priority support', 'Custom workflows'];
      if (name === 'Enterprise') return ['Dedicated account manager', 'SLA', 'SSO', 'Audit logs'];
      return [];
  };

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: priceId,
          user_id: user?.id,
          email: user?.email
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
         console.error('No checkout URL returned', data);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
        setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/create-portal-session`, {
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
        console.error('Portal error:', err);
      } finally {
          setLoading(false);
      }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={onClose}
            />
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-surface border-l border-slate-800 h-full p-6 overflow-y-auto shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Manage Subscription</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Current Plan Status */}
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                        <p className="text-sm text-primary font-medium mb-1">My Current Plan</p>
                        <div className="flex justify-between items-baseline">
                             <h3 className="text-2xl font-bold">{profile?.subscription_tier?.toUpperCase() || 'NO PLAN'}</h3>
                             <span className="text-sm font-medium px-2 py-0.5 bg-primary/20 text-primary rounded-full">{profile?.status?.toUpperCase()}</span>
                        </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Available Plans</h3>
                    
                    <div className="space-y-4">
                        {plans.map((plan) => (
                             <div key={plan.name} className={`p-4 rounded-xl border transition-colors ${
                                 plan.active ? 'border-primary bg-primary/5' : 'border-slate-800 bg-black/20 hover:border-slate-700'
                             }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold">{plan.name}</h4>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold">{plan.price}</span>
                                            <span className="text-xs text-slate-500">{plan.period}</span>
                                        </div>
                                    </div>
                                    {plan.active && <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Check size={14} /></div>}
                                </div>
                                
                                <ul className="space-y-2 mb-4">
                                     {(plan.features.length ? plan.features.slice(0, 3) : getFeatures(plan.name).slice(0, 3)).map((f: string, i: number) => (
                                         <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                             <div className="w-1 h-1 rounded-full bg-slate-600"></div> {f}
                                         </li>
                                     ))}
                                     {(plan.features.length > 3 || getFeatures(plan.name).length > 3) && (
                                         <li className="text-xs text-slate-600 italic">+ more</li>
                                     )}
                                </ul>

                                {plan.active ? (
                                    <button disabled className="w-full py-2 bg-slate-800 text-slate-500 rounded-lg text-sm font-medium border border-slate-700 cursor-default">Current Plan</button>
                                ) : (
                                    <button 
                                        onClick={() => plan.isEnterprise ? null : handleSubscribe(plan.priceId)}
                                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                                            plan.isEnterprise 
                                            ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                                            : 'bg-white text-black hover:bg-slate-200'
                                        }`}
                                    >
                                        {plan.isEnterprise ? 'Contact Sales' : loading ? 'Processing...' : 'Switch to this plan'}
                                    </button>
                                )}
                             </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                         <button 
                            onClick={handlePortal}
                            className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-sm font-medium"
                         >
                             Manage Billing Settings <ExternalLink size={16} />
                         </button>
                         <p className="text-xs text-center text-slate-600 mt-2">
                             Access receipts, payment methods, and cancel subscription via Stripe.
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
