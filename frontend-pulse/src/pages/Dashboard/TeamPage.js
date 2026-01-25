import { useOutletContext } from 'react-router-dom';

function TeamPage() {
  const { user } = useOutletContext();

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Workspace Team</h2>
        <button className="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-all opacity-50 cursor-not-allowed">
          Invite Member (Pro)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user ? (
          <div className="bg-surface border border-slate-800 p-6 rounded-2xl border-primary/20 shadow-lg shadow-primary/5">
            <div className="flex items-center gap-4 mb-4">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full border border-slate-700" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-xl font-bold">
                  {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-white">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]} (Owner)
                </h3>
                <p className="text-xs text-slate-400 font-medium tracking-wide">Admin</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
               <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
                 Active
               </span>
               <button className="text-xs text-slate-400 hover:text-white transition-colors">Personal Settings</button>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-sm italic">Loading team info...</div>
        )}
      </div>

      <div className="mt-12 p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center">
        <p className="text-slate-500 mb-4">Need to collaborate? Add more teammates to your pulse.</p>
        <button className="text-primary hover:underline text-sm font-semibold">Learn about Team Plans</button>
      </div>
    </div>
  );
}

export default TeamPage;
