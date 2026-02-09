import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Database, 
  Users,
  Ticket as TicketIcon,
  ChevronRight,
  Info,
  History,
  Plus,
  Trash2,
  Clock,
  Edit2,
  Check,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../context/AuthContext';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { getApiUrl } from '../../utils/apiConfig';
import PageHeader from '../../components/common/PageHeader';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // Keep as string for JSON serialization
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const AIWorkspace = () => {
  const { user } = useAuth();
  const { data: analyticsData } = useAnalyticsData('all');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load History
  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/intelligence/history/?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [user, fetchHistory]);

  const startNewChat = async () => {
    if (!user?.id) return;
    
    // Create an initial welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your Project Pulse AI. I have access to your project's latest tickets, team workloads, and performance trends. How can I help you today?",
      timestamp: new Date().toISOString()
    };

    try {
      setIsLoading(true);
      const payload = {
        user_id: user.id,
        title: "New Chat",
        messages: [welcomeMessage]
      };

      const res = await fetch(`${getApiUrl()}/intelligence/history/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const freshChat = await res.json();
        setCurrentChatId(freshChat.id);
        setMessages([welcomeMessage]);
        fetchHistory(); // Refresh sidebar list
      }
    } catch (error) {
      console.error('Failed to start new chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChat = async (id: string) => {
    if (!user?.id) return;
    setIsLoading(true);
    setMessages([]); // Clear immediately for snappier feel
    setCurrentChatId(id); // Set ID immediately
    try {
      const res = await fetch(`${getApiUrl()}/intelligence/history/${id}?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentChatId(data.id);
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user?.id || !window.confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      const res = await fetch(`${getApiUrl()}/intelligence/history/${id}?user_id=${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setHistory(prev => prev.filter(c => c.id !== id));
        if (currentChatId === id) startNewChat();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };
  
  const renameChat = async (id: string, newTitle: string) => {
    if (!user?.id || !newTitle.trim()) return;
    
    try {
      const res = await fetch(`${getApiUrl()}/intelligence/history/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, title: newTitle })
      });
      
      if (res.ok) {
        setHistory(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
        setEditingChatId(null);
      }
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  const saveCurrentChat = async (updatedMessages: Message[]) => {
    if (!user?.id) return;
    
    // Don't save if it's just the welcome message
    if (updatedMessages.length <= 1) return;

    try {
      const payload = {
        id: currentChatId,
        user_id: user.id,
        title: updatedMessages.find(m => m.role === 'user')?.content.substring(0, 40) + '...' || 'New Chat',
        messages: updatedMessages
      };

      const res = await fetch(`${getApiUrl()}/intelligence/history/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const freshChat = await res.json();
        if (!currentChatId) {
          setCurrentChatId(freshChat.id);
          fetchHistory(); // Refresh sidebar list
        }
      }
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsWaitingForAI(true);

    try {
      const response = await fetch(`${getApiUrl()}/intelligence/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user?.id,
          query: input,
          context: {
            total_tickets: analyticsData?.total,
            by_status: analyticsData?.by_status,
            by_priority: analyticsData?.by_priority,
            team_workload: analyticsData?.workload.slice(0, 5),
            recent_tickets: analyticsData?.recent_tickets,
            total_teams: analyticsData?.total_teams,
            urgency_avg: analyticsData?.urgency_avg
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.detail || 'Failed to get AI response');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      saveCurrentChat(finalMessages);
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsWaitingForAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <Breadcrumbs />
        <PageHeader 
          title="AI Workspace" 
          description="Interact with your project data using natural language."
        >
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startNewChat}
              className="gap-2 rounded-xl whitespace-nowrap"
            >
              <Plus size={16} /> New Chat
            </Button>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Sparkles className="text-blue-500" size={20} />
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Experimental</span>
            </div>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Area (Left for desktop, but ordered as context in previous grid) */}
          {/* We'll follow the user's request: History on the right or integrated into the layout. 
              Let's put History in the sidebar area on the right as it provides a Gemini/GPT feel. */}
          
          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex flex-col h-[700px]">
            <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 dark:border-white/5 shadow-xl shadow-blue-500/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Bot size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pulse AI Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active System</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                {!currentChatId && messages.length === 0 ? (
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
                       onClick={startNewChat}
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
                ) : (
                  <div className="space-y-6">
                    <AnimatePresence initial={false}>
                      {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[90%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                          message.role === 'user' 
                            ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10' 
                            : 'bg-blue-500/10 border-blue-500/20'
                        }`}>
                          {message.role === 'user' ? <User size={16} className="text-slate-500" /> : <Bot size={16} className="text-blue-500" />}
                        </div>
                        <div className={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm prose prose-slate dark:prose-invert max-w-none ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5 rounded-tl-none'
                          }`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 px-1">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
                {isWaitingForAI && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3 max-w-[85%] items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border bg-blue-500/10 border-blue-500/20">
                        <Bot size={16} className="text-blue-500" />
                      </div>
                      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-blue-500"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-blue-500"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                            className="w-1.5 h-1.5 rounded-full bg-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything about your tickets, team activity, or trends..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        loading={isLoading}
                        className="p-2.5 min-w-0 rounded-xl"
                      >
                       <Send size={18} />
                      </Button>
                    </div>
                  </div>
                </form>
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-500/10">
                      <Info size={12} className="text-blue-500" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Aware</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-emerald-500/10">
                      <Database size={12} className="text-emerald-500" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Metrics</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Context & History Sidebar (Right Side) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* History List */}
            <Card className="flex-1 p-6 flex flex-col overflow-hidden border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <History size={18} className="text-slate-500" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Recent Chats</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-none">
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
                        onClick={() => loadChat(chat.id)}
                        className={`w-full group text-left p-3 rounded-xl border transition-all flex items-start gap-3 relative ${
                          currentChatId === chat.id 
                            ? 'bg-blue-500/5 border-blue-500/20 ring-1 ring-blue-500/20' 
                            : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-white/5 hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${currentChatId === chat.id ? 'bg-blue-500' : 'bg-slate-400 opacity-20'}`} />
                        <div className="flex-1 min-w-0">
                           {editingChatId === chat.id ? (
                             <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                               <input
                                 autoFocus
                                 className="flex-1 bg-white dark:bg-slate-900 border border-blue-500 rounded px-2 py-1 text-xs font-bold outline-none"
                                 value={editTitle}
                                 onChange={e => setEditTitle(e.target.value)}
                                 onKeyDown={e => {
                                   if (e.key === 'Enter') renameChat(chat.id, editTitle);
                                   if (e.key === 'Escape') setEditingChatId(null);
                                 }}
                               />
                               <button onClick={() => renameChat(chat.id, editTitle)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded">
                                 <Check size={12} />
                               </button>
                               <button onClick={() => setEditingChatId(null)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                 <X size={12} />
                               </button>
                             </div>
                           ) : (
                             <>
                               <p className={`text-xs font-bold leading-tight line-clamp-2 truncate ${currentChatId === chat.id ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                 {chat.title}
                               </p>
                               <span className="text-[9px] font-medium text-slate-400">
                                 {new Date(chat.created_at).toLocaleDateString()}
                               </span>
                             </>
                           )}
                        </div>
                        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(chat.id);
                              setEditTitle(chat.title);
                            }}
                            className="p-1.5 hover:bg-blue-500/10 hover:text-blue-500 rounded-lg text-slate-400"
                          >
                             <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={(e) => deleteChat(e, chat.id)}
                            className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-400"
                          >
                             <Trash2 size={12} />
                          </button>
                        </div>
                      </button>
                    ))
                 )}
              </div>
            </Card>

            <Card className="p-6 border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Database size={20} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Active Context</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <TicketIcon size={16} className="text-blue-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tickets</span>
                  </div>
                  <Badge variant="blue" size="sm">{analyticsData?.total || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Team</span>
                  </div>
                  <Badge variant="emerald" size="sm">{analyticsData?.total_teams || 0}</Badge>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Core Knowledge</p>
                <div className="space-y-3">
                  {['Ticket Priorities', 'Team Workloads', 'Urgency Scores', 'Daily Velocity'].map((item) => (
                    <div key={item} className="flex items-center gap-2 group cursor-default">
                      <ChevronRight size={12} className="text-blue-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWorkspace;
