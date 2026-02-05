import React from 'react';
import { Activity } from 'lucide-react';

interface CommandHeaderProps {
  userName: string;
  plan: string;
}

const CommandHeader: React.FC<CommandHeaderProps> = ({ userName, plan }) => {
  return (
    <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm mb-10 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-blue-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Operational
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
            Welcome back, <span className="text-slate-900 dark:text-white font-semibold">{userName}</span>. Overview of your current operational pulse.
          </p>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
            <Activity size={20} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscription</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{plan}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandHeader;
