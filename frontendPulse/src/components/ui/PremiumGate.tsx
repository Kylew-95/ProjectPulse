import { Lock, Crown, Check, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PremiumGateProps {
    title: string;
    description: string;
    features: string[];
}

const PremiumGate = ({ title, description, features }: PremiumGateProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            // First find the enterprise price ID
            const productsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/products`);
            const products = await productsRes.json();
            console.log(products);
            interface Product {
                name: string;
                price_id: string;
                metadata?: { plan_tier_id?: string };
            }
            const enterprisePlan = products.find((p: Product) => p.metadata?.plan_tier_id === 'enterprise' || p.name === 'Enterprise');
            
            if (!enterprisePlan) {
                console.error('Enterprise plan not found');
                navigate('/pricing');
                return;
            }

            // Create checkout session
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/create-checkout-session`, {
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
        <div className="relative p-8 max-w-5xl mx-auto min-h-[70vh] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] -z-10"></div>
            
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Side: Visual & Message */}
                <div className="text-left space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest animate-bounce">
                        <Crown size={14} />
                        Enterprise Feature
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
                            {title}
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
                            {description}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                            onClick={handleUpgrade} // Actually this is line 79
                            disabled={loading}
                            className="group relative px-6 py-3 bg-white text-slate-900 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 overflow-hidden shadow-lg shadow-white/10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="text-primary" />}
                            <span>Upgrade to Enterprise</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                            onClick={() => navigate('/dashboard/overview')}
                            className="px-6 py-3 bg-slate-900/50 hover:bg-slate-800 text-white rounded-xl font-medium transition-all border border-white/5 backdrop-blur-md active:scale-95"
                        >
                            Maybe Later
                        </button>
                    </div>
                    
                    <p className="text-sm text-slate-500 italic">
                        No credit card required to explore our other features.
                    </p>
                </div>

                {/* Right Side: Features List & Locked Card */}
                <div className="relative flex flex-col items-center">
                    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-colors"></div>
                        
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Lock size={18} className="text-primary" />
                            Premium Benefits
                        </h3>
                        
                        <ul className="space-y-5">
                            {features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 group/item">
                                    <div className="mt-1 p-0.5 rounded-full bg-emerald-500/20 text-emerald-500 group-hover/item:scale-110 transition-transform">
                                        <Check size={14} />
                                    </div>
                                    <span className="text-slate-300 group-hover/item:text-white transition-colors">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <button 
                                onClick={() => navigate('/pricing')}
                                className="text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest"
                            >
                                View all plans and pricing
                            </button>
                        </div>
                    </div>
                    
                    {/* Floating elements */}
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-slate-800 rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center animate-pulse rotate-12">
                         <Crown size={32} className="text-amber-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumGate;
