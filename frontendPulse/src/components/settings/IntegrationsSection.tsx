import { Share2 } from 'lucide-react';

interface IntegrationsSectionProps {
  profile: any;
}

const IntegrationsSection = ({ profile }: IntegrationsSectionProps) => {
  if (!['pro', 'enterprise'].includes(profile?.subscription_tier || '')) {
    return null;
  }

  return (
    <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Share2 className="text-purple-400" size={24} /> Integrations
        </h2>
        <div className="bg-surface border border-slate-800 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-6">Connect your tools for automated ticket syncing.</p>
            
            <div className="space-y-6">
                {/* Jira */}
                <div className="p-4 border border-slate-700 rounded-lg bg-black/20">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            Jira Integration
                    </h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Jira Domain URL</label>
                            <input placeholder="https://your-company.atlassian.net" className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">API Token / Email</label>
                            <input type="password" placeholder="API Token" className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm" />
                        </div>
                        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">Save Jira Config</button>
                    </div>
                </div>

                {/* Trello */}
                <div className="p-4 border border-slate-700 rounded-lg bg-black/20">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            Trello Integration
                    </h3>
                    <div className="grid gap-4">
                            <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
                            <input className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm" />
                        </div>
                            <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">API Token</label>
                            <input type="password" className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm" />
                        </div>
                        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">Save Trello Config</button>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default IntegrationsSection;
