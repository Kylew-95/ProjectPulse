import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Plus,
  Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { getApiUrl } from '../../utils/apiConfig';
import PageHeader from '../../components/common/PageHeader';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import SubscriptionGate from '../../components/ui/SubscriptionGate';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Internal Components
import AISidebar from './components/AI/AISidebar';
import AIMessageList from './components/AI/AIMessageList';
import AIChatInput from './components/AI/AIChatInput';
import AILanding from './components/AI/AILanding';

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
        setHistory((prev: ChatSession[]) => prev.filter(c => c.id !== id));
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
        setHistory((prev: ChatSession[]) => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
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
            team_structure: analyticsData?.team_structure,
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
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsWaitingForAI(false);
    }
  };

  return (
    <SubscriptionGate
      tier="enterprise"
      showAddonOption={true}
      featureName="AI Workspace"
      description="Unlock powerful AI-driven insights, automated summaries, and intelligent project coaching."
      features={[
        "Persistent Chat History",
        "Deep Project Context Access",
        "Smart Ticket Summarization",
        "Automated Performance Insights",
        "Custom Knowledge Base Training"
      ]}
    >
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

        <div className="flex flex-col xl:grid xl:grid-cols-4 gap-6 xl:gap-8">
          {/* Main Chat Area */}
          <div className="xl:col-span-3 flex flex-col h-[600px] sm:h-[700px] xl:h-[800px]">
            <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 dark:border-white/5 shadow-xl shadow-blue-500/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              {/* Chat Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Bot size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Pulse AI Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active System</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              {!currentChatId && messages.length === 0 ? (
                <AILanding onStartNewChat={startNewChat} />
              ) : (
                <AIMessageList 
                  messages={messages}
                  isWaitingForAI={isWaitingForAI}
                  messagesEndRef={messagesEndRef}
                />
              )}

              {/* Input Area */}
              <AIChatInput 
                input={input}
                setInput={setInput}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="order-last xl:order-none xl:col-span-1">
            <AISidebar 
              history={history}
              currentChatId={currentChatId}
              isHistoryLoading={isHistoryLoading}
              onLoadChat={loadChat}
              onDeleteChat={deleteChat}
              onRenameChat={renameChat}
              analyticsData={analyticsData}
              editingChatId={editingChatId}
              setEditingChatId={setEditingChatId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
            />
          </div>
        </div>


      </div>
    </div>
  </SubscriptionGate>
);
};

export default AIWorkspace;
