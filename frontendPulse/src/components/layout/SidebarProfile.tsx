import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Server } from 'lucide-react';

const SidebarProfile = () => {
    const { user, profile } = useAuth();
    const { theme } = useTheme();

    return (
        <div className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl border transition-colors ${
            theme === 'dark' 
            ? 'bg-white/5 border-white/5' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
            <img 
                src={user?.user_metadata?.avatar_url} 
                alt={`${user?.user_metadata?.full_name || 'User'}'s profile avatar`} 
                className="w-8 h-8 rounded-full" 
            />
            <div className="flex-1 overflow-hidden">
              <p className={`text-sm font-medium truncate ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                  {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className={`font-semibold text-xs ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                  {profile?.subscription_tier || 'Free'} <span className={`text-xs uppercase tracking-wider font-semibold ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}>Plan</span>
              </p>
            </div>
            
            <a 
                href="https://discord.gg/your-server" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`p-1.5 rounded-lg transition-colors ${
                    theme === 'dark' 
                    ? 'text-slate-400 hover:text-white hover:bg-white/10' 
                    : 'text-slate-400 hover:text-[#5865F2] hover:bg-[#5865F2]/10'
                }`}
                title="Go to your server"
            >
                <Server size={20} />
            </a>
        </div>
    );
};

export default SidebarProfile;
