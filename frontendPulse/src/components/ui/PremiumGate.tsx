import { Crown, Check, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/apiConfig';

interface PremiumGateProps {
    title: string;
    description: string;
    features: string[];
}

const PremiumGate = ({ title, description, features }: PremiumGateProps) => {
    const { user, profile } = useAuth();

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const isEnterprise = ['enterprise', 'super_admin'].includes(profile?.subscription_tier || '');

    if (isEnterprise) {
        return null; // Return null because the parent usually renders children if enterprise
    }

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const apiUrl = getApiUrl();
            const productsRes = await fetch(`${apiUrl}/billing/products`);
            const products = await productsRes.json();
            
            const enterprisePlan = products.find((p: { metadata?: { plan_tier_id?: string }, name: string, price_id: string }) => p.metadata?.plan_tier_id === 'enterprise' || p.name === 'Enterprise');
            
            if (!enterprisePlan) {
                navigate('/pricing');
                return;
            }

            const response = await fetch(`${apiUrl}/billing/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    price_id: enterprisePlan.price_id,
                    user_id: user?.id,
                    success_url: `${window.location.origin}/dashboard/overview?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: window.location.href
                }),
            });
            const { url } = await response.json();
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Upgrade failed:', error);
            navigate('/pricing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full py-6">
            <div className="relative w-full overflow-hidden group">
                {/* Subtle background glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-[2.5rem] blur-xl opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                        {/* Left Side: Branding & CTA */}
                        <div className="flex-1 text-center md:text-left space-y-6">
                            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-100 dark:border-amber-500/20 mx-auto md:mx-0">
                                <Crown className="text-amber-500" size={32} />
                            </div>
                            
                            <div className="space-y-3">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {title}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            <button 
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="w-full md:w-auto inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Sparkles size={20} />
                                )}
                                <span>Upgrade to Enterprise</span>
                            </button>
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
                        Scale your operations with pulse intelligence
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PremiumGate;
