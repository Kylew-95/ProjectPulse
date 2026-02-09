import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Ticket as TicketIcon, Users, Database } from 'lucide-react';
import Button from '../../../../components/ui/Button';

interface AILandingProps {
  onStartNewChat: () => void;
}

const AILanding: React.FC<AILandingProps> = ({ onStartNewChat }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-white/20">
          <Sparkles size={48} className="text-white" />
        </div>
      </motion.div>
      
      <div className="max-w-md space-y-3">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
          How can I assist you?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
          Start a fresh conversation to analyze your project data, track performance, or get team insights in real-time.
        </p>
      </div>

      <Button 
        onClick={onStartNewChat}
        className="gap-2 px-10 py-7 rounded-2xl text-lg font-bold shadow-2xl shadow-blue-500/20 group hover:scale-105 transition-all"
      >
        <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" /> 
        Start New Chat
      </Button>

      <div className="flex items-center gap-8 pt-6 opacity-40">
        <div className="flex flex-col items-center gap-1">
          <TicketIcon size={20} className="text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Tickets</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Users size={20} className="text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Team</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Database size={20} className="text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Metrics</span>
        </div>
      </div>
    </div>
  );
};

export default AILanding;
