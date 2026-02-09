import React from 'react';
import { Send, Info, Database } from 'lucide-react';
import Button from '../../../../components/ui/Button';

interface AIChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const AIChatInput: React.FC<AIChatInputProps> = ({ input, setInput, onSendMessage, isLoading }) => {
  return (
    <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
      <form onSubmit={onSendMessage} className="relative flex items-center gap-2">
        <div className="relative flex-1 group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-16 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              loading={isLoading}
              className="p-2 sm:p-2.5 min-w-0 rounded-xl"
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Button>
          </div>
        </div>
      </form>
      <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-500/10">
            <Info size={10} className="text-blue-500" />
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Aware</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-500/10">
            <Database size={10} className="text-emerald-500" />
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Metrics</span>
        </div>
      </div>
    </div>

  );
};

export default AIChatInput;
