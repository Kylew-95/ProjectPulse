import { Share2, MessageSquare, Trello, Github, Slack, MessageCircle, Settings as SettingsIcon, ChevronDown, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import SubscriptionGate from '../ui/SubscriptionGate';
import type { Profile } from '../../types/auth';
import { useState, useEffect } from 'react';

interface IntegrationsSectionProps {
    profile: Profile | null;
}

interface DiscordChannel {
    id: string;
    name: string;
}

const IntegrationsSection = ({ profile }: IntegrationsSectionProps) => {
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<string>('');
    const [savingChannel, setSavingChannel] = useState(false);
    const [showConfigure, setShowConfigure] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (profile?.discord_channel_id) {
            setSelectedChannel(profile.discord_channel_id);
        }
    }, [profile]);

    const fetchChannels = async () => {
        if (!profile?.discord_guild_id) return;
        setLoadingChannels(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/discord/channels/${profile.discord_guild_id}`);
            const data = await response.json();
            if (data.channels) {
                setChannels(data.channels);
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
        } finally {
            setLoadingChannels(false);
        }
    };

    const handleSaveChannel = async () => {
        if (!profile?.discord_guild_id || !selectedChannel) return;
        setSavingChannel(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/discord/learning-channel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guild_id: profile.discord_guild_id,
                    channel_id: selectedChannel
                })
            });
            if (response.ok) {
                setSuccessMessage('Learning channel updated!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error saving channel:', error);
        } finally {
            setSavingChannel(false);
        }
    };

    const toggleConfigure = () => {
        if (!showConfigure && channels.length === 0) {
            fetchChannels();
        }
        setShowConfigure(!showConfigure);
    };

    const handleConnectDiscord = () => {
        const clientId = '1464385808914976923';
        const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
        window.open(url, '_blank');
    };

    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    const handleSyncGuild = async () => {
        if (!profile?.id) return;
        setSyncing(true);
        setSyncMessage('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/discord/sync-guild`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: profile.id })
            });
            const data = await response.json();
            if (response.ok) {
                setSyncMessage(`✓ Linked to ${data.guild_name}`);
                setTimeout(() => {
                    window.location.reload(); // Refresh to update profile
                }, 1500);
            } else {
                setSyncMessage(`✗ ${data.detail || 'Failed to sync'}`);
            }
        } catch (error) {
            console.error('Error syncing guild:', error);
            setSyncMessage('✗ Error syncing server');
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncMessage(''), 5000);
        }
    };


  return (
    <section className="space-y-6">
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
        <Share2 className="text-purple-400" size={24} /> Integrations
        </h2>
        
        {/* Discord Bot - Available for all tiers */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-2 overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 border-l-4 border-l-[#5865F2]">
                <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#5865F2] rounded-lg flex items-center justify-center">
                    <MessageCircle className="text-white" size={24} />
                </div>
                <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Discord Bot</div>
                    <div className="text-sm text-slate-500">
                        {profile?.discord_guild_id ? (
                            <span className="flex items-center gap-1 text-green-500 font-medium">
                                <CheckCircle2 size={14} /> Connected to server
                            </span>
                        ) : (
                            <>Add the ProjectPulse bot to your server <br />
                            <span className="text-green-500 dark:text-green-400 font-semibold text-xs text-nowrap">Be sure to create a server before adding the bot</span></>
                        )}
                    </div>
                </div>
                </div>
                <div className="flex items-center gap-2">
                    {profile?.discord_guild_id && (
                        <button 
                            onClick={toggleConfigure}
                            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
                            title="Configure AI Learning"
                        >
                            <SettingsIcon size={20} className={showConfigure ? 'text-primary' : ''} />
                        </button>
                    )}
                    <button 
                        onClick={handleConnectDiscord}
                        className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-[#5865F2]/20"
                    >
                        {profile?.discord_guild_id ? 'Reconnect' : 'Add to Server'}
                    </button>
                    {!profile?.discord_guild_id && (
                        <button 
                            onClick={handleSyncGuild}
                            disabled={syncing}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg disabled:opacity-50 flex items-center gap-2"
                            title="Sync your Discord server after adding the bot"
                        >
                            {syncing ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Syncing...
                                </>
                            ) : (
                                'Sync Server'
                            )}
                        </button>
                    )}
                </div>
            </div>
            
            {/* Sync status message */}
            {syncMessage && (
                <div className={`mt-2 text-sm font-medium ${syncMessage.startsWith('✓') ? 'text-green-500' : 'text-red-500'}`}>
                    {syncMessage}
                </div>
            )}

            {/* AI Learning Channel Configuration */}
            {profile?.discord_guild_id && showConfigure && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                    <SubscriptionGate 
                        tier="enterprise"
                        featureName="AI Learning Configuration"
                        description="AI Learning and background automation are exclusive to Enterprise partners."
                        features={[
                            "Real-time Discord Learning",
                            "Background Context Automation",
                            "Priority Sync Support",
                            "Custom Channel Mapping"
                        ]}
                    >
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/10">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="text-primary" size={18} />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                AI Learning Configuration
                                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest">Enterprise</span>
                            </h4>
                        </div>
                        
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                            Choose the channel where Pulse should listen for messages to learn from. This allows the AI to stay updated on project context automatically.
                        </p>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Discord Channel</label>
                                <div className="relative group">
                                    <select 
                                        value={selectedChannel}
                                        onChange={(e) => setSelectedChannel(e.target.value)}
                                        disabled={loadingChannels || savingChannel}
                                        className="w-full appearance-none px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                                    >
                                        <option value="">Select a channel...</option>
                                        {channels.map(ch => (
                                            <option key={ch.id} value={ch.id}>#{ch.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        {loadingChannels ? <Loader2 className="animate-spin" size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-[10px] text-green-500 font-bold uppercase transition-opacity duration-300">
                                    {successMessage}
                                </div>
                                <button 
                                    onClick={handleSaveChannel}
                                    disabled={!selectedChannel || savingChannel || loadingChannels}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    {savingChannel ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                    Save Preference
                                </button>
                            </div>
                        </div>
                        </div>
                    </SubscriptionGate>
                </div>
            )}
        </div>

        {/* Pro+ Integrations */}
        <SubscriptionGate 
            tier="pro"
            featureName="Integrations" 
            description="Connect your favorite tools like Jira, Trello, GitHub, and Slack. Upgrade to Pro to unlock integrations."
            features={[
                "Full Jira Sync",
                "Trello Board Integration",
                "GitHub PR Linking",
                "Slack Real-time Alerts",
                "Custom Webhooks"
            ]}
        >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                <div className="space-y-4">
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
        </SubscriptionGate>
    </section>
  );
};

export default IntegrationsSection;
