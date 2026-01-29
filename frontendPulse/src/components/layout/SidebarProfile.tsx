import { useAuth } from '../../context/AuthContext';

const SidebarProfile = () => {
    const { user,profile } = useAuth();

    console.log(profile?.subscription_tier);

    return (
        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/5 border border-white/5">
            <img src={user?.user_metadata?.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-slate-200">{user?.user_metadata?.name?.split(' ')[0]?.slice(0, -2) || 'User'}</p>
              <p className="text-slate-300 font-semibold text-xs">{profile?.subscription_tier || 'Free'} <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Plan</span></p>
            </div>
        </div>
    );
};

export default SidebarProfile;
