import { Rocket } from 'lucide-react';

interface SubscriptionSectionProps {
  profile: any;
  onManageClick: () => void;
}

const SubscriptionSection = ({ profile, onManageClick }: SubscriptionSectionProps) => {
  return (
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Rocket className="text-primary" size={24} /> Subscription
      </h2>
      
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
         <div className="p-6 border-b border-slate-800 flex justify-between items-center">
           <div>
              <p className="text-sm text-slate-400">Current Plan</p>
              <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                  {profile?.subscription_tier?.toUpperCase() || 'NO PLAN'}
                  </h3>
                  <span className="text-sm px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {profile?.status?.toUpperCase() || 'INACTIVE'}
                  </span>
              </div>
           </div>
           <button 
              onClick={onManageClick}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium border border-slate-700 hover:border-slate-600"
           >
              Manage Subscription
           </button>
         </div>
      </div>
    </section>
  );
};

export default SubscriptionSection;
