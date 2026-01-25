import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Pricing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('http://localhost:8000/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Auto-redirect to checkout if user logged in after clicking a plan
  useEffect(() => {
    const pendingPlanId = localStorage.getItem('subscription_tier_id');
    console.log('Pricing Effect Debug:', { user: user?.email, pendingPlanId }); // DEBUG

    if (user && pendingPlanId) {
        console.log('Found pending plan, redirecting to checkout:', pendingPlanId);
        localStorage.removeItem('subscription_tier_id'); // Clear it so it doesn't loop
        handleSelectPlan(pendingPlanId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSelectPlan = async (priceId) => {
    if (!user) {
        localStorage.setItem('subscription_tier_id', priceId);
        navigate('/login');
        return;
    }

    console.log('Creating checkout session for user:', user); // DEBUG

    try {
      const payload = { price_id: priceId, email: user.email, user_id: user.id };
      console.log('Checkout Payload:', payload); // DEBUG

      const response = await fetch('http://localhost:8000/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Choose your plan</h1>
          <p className="text-slate-400">Unlock the full power of our Discord Integration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product) => (
            <div 
              key={product.id} 
              className={`bg-surface/30 border ${product.metadata?.featured === 'true' ? 'border-primary shadow-2xl shadow-primary/10 transform scale-105' : 'border-slate-800'} rounded-2xl p-8 hover:border-slate-700 transition-all flex flex-col h-full relative`}
            >
              {product.metadata?.featured === 'true' && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2 lowercase first-letter:uppercase">{product.name}</h2>
              <div className="text-4xl font-bold mb-2">
                £{product.price}
                <span className="text-sm text-slate-400 font-normal">/mo</span>
              </div>

               {/* Display Tickets Info */}
               {product.metadata?.tickets && (
                <div className="mb-2 text-sm font-bold text-primary uppercase tracking-wider">
                  {product.metadata.tickets}
                </div>
              )}
              
              {/* Display Trial Info */}
              {product.metadata?.trial_days && (
                <div className="mb-4 text-sm font-semibold text-emerald-400">
                  {product.metadata.trial_days}-Day Free Trial
                </div>
              )}

              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                {product.description || 'Perfect for your projects and growing teams.'}
              </p>
              
              <ul className="space-y-4 mb-10 text-sm flex-1">
                {product.metadata?.features?.split(',').map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-slate-300">
                    <svg className={`w-5 h-5 ${product.metadata?.featured === 'true' ? 'text-primary' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature.trim()}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => {
                  if (product.metadata?.plan_id === 'enterprise') {
                    navigate('/about');
                  } else {
                    handleSelectPlan(product.price_id);
                  }
                }}
                className={`w-full py-4 ${product.metadata?.featured === 'true' ? 'bg-primary hover:bg-blue-600 shadow-lg shadow-primary/25' : 'bg-slate-800 hover:bg-slate-700'} text-white font-bold rounded-xl transition-all mt-auto`}
              >
                {product.metadata?.cta || 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Pricing;
