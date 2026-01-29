import { CreditCard } from 'lucide-react';

interface AccountSectionProps {
  user: any;
  profile: any;
}

const AccountSection = ({ user }: AccountSectionProps) => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="text-slate-400" size={24} /> Account Details
      </h2>
      <div className="bg-surface border border-slate-800 rounded-xl p-6">
          <div className="grid gap-6">
              <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input disabled value={user?.user_metadata.email || ''} className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
              </div>
          </div>
      </div>
    </section>
  );
};

export default AccountSection;
