import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Loader2 } from 'lucide-react';

interface ProGateProps {
  children: ReactNode;
  featureName?: string;
  description?: string;
}

const ProGate = ({ 
  children, 
  featureName = "Pro Feature", 
  description = "This feature is available exclusively for Pro users. Upgrade now to unlock this functionality." 
}: ProGateProps) => {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isPro = ['pro', 'enterprise'].includes(profile?.subscription_tier || '');

  const handleUpgrade = async () => {
    setLoading(true);
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        // 1. Get Products to find Pro Price
        const prodRes = await fetch(`${apiUrl}/products`);
        const products = await prodRes.json();
        const proPlan = products.find((p: any) => p.name === 'Pro');
        
        if (!proPlan?.price_id) {
            console.error("Pro plan not found");
            return;
        }

        // 2. Create Checkout
        const response = await fetch(`${apiUrl}/create-checkout-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                price_id: proPlan.price_id,
                user_id: user?.id,
                email: user?.email
            }),
        });
        
        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        }
    } catch (error) {
        console.error("Upgrade failed:", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className={`transition-all duration-300 ${!isPro ? 'opacity-20 blur-[6px] pointer-events-none select-none grayscale overflow-hidden' : ''}`}>
        {children}
      </div>

      {!isPro && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center -mt-20">
          <div className="bg-black/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl text-center max-w-md mx-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="text-primary" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{featureName}</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              {description}
            </p>
            <button 
                onClick={handleUpgrade}
                disabled={loading}
                className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all w-full shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                    </>
                ) : (
                    'Upgrade to Pro'
                )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProGate;
