import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Database, 
  BarChart3, 
  Users, 
  Ticket as TicketIcon,
  ChevronRight,
  Info
} from 'lucide-react';
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
  timestamp: Date;
}

const AIWorkspace = () => {
  const { user } = useAuth();
  const { data: analyticsData } = useAnalyticsData('all');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Project Pulse AI. I have access to your project's latest tickets, team workloads, and performance trends. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
            team_workload: analyticsData?.workload.slice(0, 5), // Top 5
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
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Sparkles className="text-blue-500" size={20} />
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Experimental</span>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                          message.role === 'user' 
                            ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10' 
                            : 'bg-blue-500/10 border-blue-500/20'
                        }`}>
                          {message.role === 'user' ? <User size={16} className="text-slate-500" /> : <Bot size={16} className="text-blue-500" />}
                        </div>
                        <div className={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5 rounded-tl-none'
                          }`}>
                            {message.content.split('\n').map((line, i) => (
                              <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                            ))}
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 px-1">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (
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

          {/* Context Sidebar */}
          <div className="lg:col-span-1 space-y-6">
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
                  <Badge variant="emerald" size="sm">{analyticsData?.workload.length || 0}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={16} className="text-amber-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Trends</span>
                  </div>
                  <Badge variant="amber" size="sm">Active</Badge>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Core Knowledge</p>
                <ul className="space-y-3">
                  {['Ticket Priorities', 'Team Workloads', 'Urgency Scores', 'Daily Velocity'].map((item) => (
                    <li key={item} className="flex items-center gap-2 group cursor-default">
                      <ChevronRight size={12} className="text-blue-500 transform group-hover:translate-x-1 transition-transform" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 border-none shadow-lg shadow-blue-600/20">
              <h4 className="text-white font-bold mb-2">Try asking...</h4>
              <div className="space-y-2">
                {[
                  "Who is most busy?",
                  "Summarize my tickets",
                  "What is our velocity?",
                  "Any critical issues?"
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="w-full text-left p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-xs font-medium transition-colors border border-white/10"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWorkspace;
