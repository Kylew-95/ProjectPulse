import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Check, Rocket, Shield, Zap } from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Container from '../../components/ui/Container';

interface Plan {
  id: string;
  name: string;
  price: string;
  priceId: string;
  period: string;
  features: string[];
  isEnterprise: boolean;
}

interface StripeProduct {
  id: string;
  name: string;
  price: number;
  price_id: string;
  description: string | null;
}

const Pricing = () => {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isTrialActive = profile?.trial_end ? new Date(profile.trial_end) > new Date() : false;
    if (['active', 'trialing'].includes(profile?.status || '') || isTrialActive || profile?.subscription_tier === 'super_admin') {
       navigate('/dashboard/overview');
    }

    const fetchPlans = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/billing/products`);
        if (res.ok) {
          const data: StripeProduct[] = await res.json();
          const formatted = data.sort((a, b) => a.price - b.price).map((p) => ({
             id: p.id,
             name: p.name,
             price: `£${Math.floor(p.price)}`,
             period: '/mo',
             features: p.description && !p.name.includes('Enterprise') ? p.description.split(',') : [],
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
  }, [profile, navigate]);

  const getFeatures = (name: string) => {
      if (name === 'Starter') return ['2,000 Tickets/mo', 'Basic analytics', 'Community support', 'Email notifications'];
      if (name === 'Pro') return ['10,000 Tickets/mo', 'Auto-sync to Jira/Trello/GitHub', 'Advanced analytics', 'Priority support', 'Custom workflows'];
      if (name === 'Enterprise') return ['Unlimited Tickets', 'AI Analytics (Enterprise Only)', 'Knowledge Base & AI Replies', 'Dedicated account manager', 'SLA & Uptime Guarantee'];
      return [];
  };

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/billing/create-checkout-session`, {
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
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={`${theme} min-h-screen bg-background text-main flex flex-col items-center relative overflow-hidden transition-colors duration-300`}>
      <Navbar />

      <Container className="flex-1 w-full flex flex-col items-center justify-center py-20">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
          Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Pricing</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto">
          Choose the perfect plan for your team. No hidden fees.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative z-10 w-full">
        {plans.map((plan, index) => (
          <Card 
            key={plan.name} 
            glass={plan.name === 'Pro'}
            className={`relative flex flex-col p-8 transition-all duration-300 hover:-translate-y-2 !rounded-3xl !border ${
                plan.name === 'Pro' 
                ? 'bg-gradient-to-b from-slate-800/80 to-slate-900/80 border-primary/50 shadow-2xl shadow-primary/20 scale-105 z-20' 
                : 'bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-900/60 text-white'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
             
             {plan.name === 'Pro' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg border border-white/20 tracking-wide uppercase">
                      Most Popular
                  </div>
             )}

             <div className="mb-8">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${
                   plan.name === 'Pro' ? 'bg-primary/20 text-primary ring-1 ring-primary/50' : 'bg-slate-800 text-slate-400'
               }`}>
                  {plan.name === 'Starter' && <Rocket size={28} />}
                  {plan.name === 'Pro' && <Zap size={28} />}
                  {plan.name === 'Enterprise' && <Shield size={28} />}
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
               <div className="flex items-baseline gap-1">
                 <span className="text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
                 <span className="text-muted font-medium">{plan.period}</span>
               </div>
               <p className="text-sm font-medium text-muted/80 mt-2">
                 {plan.name === 'Starter' ? 'Inc. VAT' : plan.name === 'Enterprise' ? 'Inc. VAT' : '+ VAT'}
               </p>
             </div>

             <div className="border-t border-white/5 my-6"></div>

             <ul className="space-y-4 mb-8 flex-1">
               {(plan.features.length ? plan.features : getFeatures(plan.name)).map((f: string) => (
                 <li key={f} className="flex items-start gap-3 text-muted group">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                       plan.name === 'Pro' ? 'bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-slate-800 text-muted group-hover:text-slate-300'
                   }`}>
                       <Check size={14} strokeWidth={3} />
                   </div>
                   <span className="text-sm font-medium leading-relaxed text-muted">{f}</span>
                 </li>
               ))}
             </ul>

              <Button
                onClick={() => handleSubscribe(plan.priceId)}
                loading={loading}
                variant={plan.name === 'Pro' ? 'primary' : 'secondary'}
                className="w-full py-4 text-base"
              >
                {plan.name === 'Pro' ? 'Start 1-Week Free Trial' : 'Switch to this plan'}
              </Button>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-muted/60 text-sm mb-2 flex items-center justify-center gap-2">
            <Shield size={14} /> Secure payments powered by Stripe
        </p>
        <p className="text-muted/40 text-xs">
            Cancel anytime. No long-term contracts.
        </p>
      </div>
      </Container>
    </div>
  );
};

export default Pricing;
