import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, Sparkles, Loader2, Zap, Crown, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getApiUrl } from '../../utils/apiConfig';

interface SubscriptionGateProps {
  children?: ReactNode;
  tier: 'pro' | 'enterprise';
  featureName: string;
  description: string;
  features: string[];
  showAddonOption?: boolean;
}

const SubscriptionGate = ({ 
  children, 
  tier,
  featureName, 
  description,
  features,
  showAddonOption = false
}: SubscriptionGateProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addonLoading, setAddonLoading] = useState(false);

  const currentTier = profile?.subscription_tier || 'starter';
  const addons = profile?.addons || [];
  
  const hasAccess = 
    (tier === 'pro' && ['pro', 'enterprise', 'super_admin'].includes(currentTier)) ||
    (tier === 'enterprise' && ['enterprise', 'super_admin'].includes(currentTier)) ||
    (showAddonOption && addons.includes('ai_workspace'));

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const productsRes = await fetch(`${apiUrl}/billing/products`);
      const products = await productsRes.json();
      
      const targetPlan = products.find((p: { metadata?: { plan_tier_id?: string }, name: string, price_id: string }) => 
        p.metadata?.plan_tier_id === tier || p.name.toLowerCase() === tier.toLowerCase()
      );
      
      if (!targetPlan) {
        navigate('/pricing');
        return;
      }

      await initiateCheckout(targetPlan.price_id);
    } catch (error) {
      console.error('Upgrade failed:', error);
      navigate('/pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleAddonPurchase = async () => {
    setAddonLoading(true);
    try {
      const apiUrl = getApiUrl();
      const productsRes = await fetch(`${apiUrl}/billing/products`);
      const products = await productsRes.json();
      
      // Find AI Workspace Add-on
      const addonProduct = products.find((p: { metadata?: { addon_key?: string }, name: string }) => 
          p.metadata?.addon_key === 'ai_workspace'
      );
      
      if (!addonProduct) {
        alert("AI Workspace Add-on not found. Please contact support.");
        return;
      }

      await initiateCheckout(addonProduct.price_id);

    } catch (error) {
      console.error('Add-on purchase failed:', error);
    } finally {
      setAddonLoading(false);
    }
  };

  const initiateCheckout = async (priceId: string) => {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          price_id: priceId,
          user_id: user?.id,
          success_url: `${window.location.origin}/dashboard/overview?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: window.location.href
        }),
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  const isEnterprise = tier === 'enterprise';
  const Icon = isEnterprise ? Crown : Zap;
  const accentColor = isEnterprise ? 'amber' : 'indigo';
  const gradientFrom = isEnterprise ? 'from-amber-500/10' : 'from-indigo-500/10';
  const gradientTo = isEnterprise ? 'to-orange-500/10' : 'to-blue-500/10';
  const buttonBg = isEnterprise 
    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
    : 'bg-primary hover:bg-blue-600';
  const shadowColor = isEnterprise ? 'shadow-amber-500/20' : 'shadow-primary/20';

  return (
    <div className="w-full py-6">
      <div className="relative w-full overflow-hidden group">
        {/* Subtle background glow */}
        <div className={`absolute -inset-1 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-[2.5rem] blur-xl opacity-50 transition-opacity duration-500 group-hover:opacity-100`} />
        
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            {/* Left Side: Branding & CTA */}
            <div className="flex-1 text-center md:text-left space-y-6">
              <div className={`w-16 h-16 bg-${accentColor}-50 dark:bg-${accentColor}-500/10 rounded-2xl flex items-center justify-center border border-${accentColor}-100 dark:border-${accentColor}-500/20 mx-auto md:mx-0`}>
                <Icon className={`text-${isEnterprise ? 'amber-500' : 'primary'}`} size={32} />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {tier === 'enterprise' ? 'Enterprise ' : 'Pro '}{featureName}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full md:w-auto">
                  <button 
                    onClick={handleUpgrade}
                    disabled={loading || addonLoading}
                    className={`w-full inline-flex items-center justify-center px-10 py-4 ${buttonBg} text-white font-bold rounded-2xl transition-all shadow-lg ${shadowColor} hover:scale-[1.02] active:scale-95 disabled:opacity-50 gap-2`}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Sparkles size={20} />
                    )}
                    <span>Upgrade to {isEnterprise ? 'Enterprise' : 'Pro'}</span>
                  </button>

                  {/* Add-on Option */}
                  {showAddonOption && (
                      <div className="w-full pt-4 border-t border-slate-100 dark:border-white/5">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center md:text-left">
                              Or get it as an add-on
                          </p>
                          <button
                            onClick={handleAddonPurchase}
                            disabled={loading || addonLoading}
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 gap-2"
                          >
                             {addonLoading ? <Loader2 className="animate-spin" size={16} /> : <Bot size={16} className="text-indigo-500" />}
                             <span>Enable AI Workspace (£30/mo)</span>
                          </button>
                      </div>
                  )}
              </div>
            </div>

            {/* Right Side: Features List */}
            <div className="flex-1 w-full">
              <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/10">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Included Features</h4>
                <div className="space-y-4">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-emerald-500 font-bold" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-slate-400 dark:text-slate-500 text-[10px] mt-10 font-bold uppercase tracking-[0.3em]">
            Unlock specialized tools & intelligence
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGate;
