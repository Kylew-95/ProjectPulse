import { Share2, MessageSquare, Trello, Github, Slack, MessageCircle } from 'lucide-react';
import ProGate from '../ui/ProGate';

const IntegrationsSection = () => {
    const handleConnectDiscord = () => {
        const clientId = '1464385808914976923';
        // Scopes: bot, applications.commands
        // Permissions: 8 (Administrator) for full access, or you can use a specific bitmask
        const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
        window.open(url, '_blank');
    };

  return (
    <section className="relative mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Share2 className="text-purple-400" size={24} /> Integrations
        </h2>
        
        <ProGate featureName="Integrations" description="Connect your favorite tools like Jira, Trello, and Slack. Upgrade to Pro to unlock integrations.">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                <div className="space-y-4">
                {/* Discord Integration */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 border-l-4 border-l-[#5865F2]">
                    <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#5865F2] rounded-lg flex items-center justify-center">
                        <MessageCircle className="text-white" size={24} />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Discord Bot</div>
                        <div className="text-sm text-slate-500">Add the ProjectPulse bot to your server</div>
                    </div>
                    </div>
                    <button 
                        onClick={handleConnectDiscord}
                        className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-[#5865F2]/20"
                    >
                        Add to Server
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#0052CC] rounded-lg flex items-center justify-center">
                        <MessageSquare className="text-white" size={24} />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Jira</div>
                        <div className="text-sm text-slate-500">Connect to your Jira workspace</div>
                    </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium">Connect</button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#0079BF] rounded-lg flex items-center justify-center">
                        <Trello className="text-white" size={24} />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Trello</div>
                        <div className="text-sm text-slate-500">Sync with Trello boards</div>
                    </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium">Connect</button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#24292e] rounded-lg flex items-center justify-center">
                        <Github className="text-white" size={24} />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 dark:text-white">GitHub</div>
                        <div className="text-sm text-slate-500">Link pull requests to tickets</div>
                    </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium">Connect</button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center">
                        <Slack className="text-white" size={24} />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Slack</div>
                        <div className="text-sm text-slate-500">Receive notifications in Slack</div>
                    </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium">Connect</button>
                </div>
                </div>
            </div>
        </ProGate>
    </section>
  );
};

export default IntegrationsSection;

