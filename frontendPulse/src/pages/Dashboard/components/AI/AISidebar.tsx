import React from 'react';
import { 
  History, 
  Clock, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Database,
  Ticket as TicketIcon,
  Users,
  ChevronRight
} from 'lucide-react';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';
import type { AnalyticsData } from '../../hooks/useAnalyticsData';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AISidebarProps {
  history: ChatSession[];
  currentChatId: string | null;
  isHistoryLoading: boolean;
  onLoadChat: (id: string) => void;
  onDeleteChat: (e: React.MouseEvent, id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  analyticsData: AnalyticsData | null;
  editingChatId: string | null;
  setEditingChatId: (id: string | null) => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
}

const AISidebar: React.FC<AISidebarProps> = ({
  history,
  currentChatId,
  isHistoryLoading,
  onLoadChat,
  onDeleteChat,
  onRenameChat,
  analyticsData,
  editingChatId,
  setEditingChatId,
  editTitle,
  setEditTitle,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* History List */}
      <Card className="flex-1 p-4 sm:p-6 flex flex-col overflow-hidden border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <History size={16} className="text-slate-500" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Recent Chats</h3>
          </div>
        </div>

        <div className="max-h-[300px] xl:max-h-none overflow-y-auto space-y-2 scrollbar-none">
          {isHistoryLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={24} className="mx-auto text-slate-300 mb-2 opacity-50" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-normal px-4">
                No history yet.<br/>Start a conversation!
              </p>
            </div>
          ) : (
            history.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onLoadChat(chat.id)}
                className={`w-full group text-left p-2.5 sm:p-3 rounded-xl border transition-all flex items-start gap-3 relative ${
                  currentChatId === chat.id 
                    ? 'bg-blue-500/5 border-blue-500/20 ring-1 ring-blue-500/20' 
                    : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-white/5 hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${currentChatId === chat.id ? 'bg-blue-500' : 'bg-slate-400 opacity-20'}`} />
                <div className="flex-1 min-w-0">
                  {editingChatId === chat.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        className="flex-1 bg-white dark:bg-slate-900 border border-blue-500 rounded px-2 py-1 text-[10px] sm:text-xs font-bold outline-none"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') onRenameChat(chat.id, editTitle);
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                      />
                      <button onClick={() => onRenameChat(chat.id, editTitle)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded">
                        <Check size={10} />
                      </button>
                      <button onClick={() => setEditingChatId(null)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`text-[11px] sm:text-xs font-bold leading-tight line-clamp-1 sm:line-clamp-2 truncate ${currentChatId === chat.id ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {chat.title}
                      </p>
                      <span className="text-[8px] sm:text-[9px] font-medium text-slate-400">
                        {new Date(chat.created_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChatId(chat.id);
                      setEditTitle(chat.title);
                    }}
                    className="p-1 hover:bg-blue-500/10 hover:text-blue-500 rounded text-slate-400"
                  >
                    <Edit2 size={10} />
                  </button>
                  <button 
                    onClick={(e) => onDeleteChat(e, chat.id)}
                    className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded text-slate-400"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-6 border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Database size={18} className="text-blue-500" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Active Context</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 sm:gap-3">
              <TicketIcon size={14} className="text-blue-500" />
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">Tickets</span>
            </div>
            <Badge variant="blue" size="xs">{analyticsData?.total || 0}</Badge>
          </div>
          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users size={14} className="text-emerald-500" />
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">Team</span>
            </div>
            <Badge variant="emerald" size="xs">{analyticsData?.total_teams || 0}</Badge>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 hidden sm:block">
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 sm:mb-4">Core Knowledge</p>
          <div className="space-y-2 sm:y-3">
            {['Ticket Priorities', 'Team Workloads', 'Urgency Scores', 'Daily Velocity'].map((item) => (
              <div key={item} className="flex items-center gap-2 group cursor-default">
                <ChevronRight size={10} className="text-blue-500" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>

  );
};

export default AISidebar;
