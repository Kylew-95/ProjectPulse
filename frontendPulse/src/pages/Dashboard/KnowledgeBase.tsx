import { useState, useEffect, useCallback } from 'react';
import { Book, Plus, Search, Edit2, Trash2, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import PremiumGate from '../../components/ui/PremiumGate';

interface KBEntry {
  id: number;
  question: string;
  answer: string;
  created_at: string;
}

const KnowledgeBase = () => {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [submitting, setSubmitting] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/knowledge-base?user_id=${user.id}`);
      if (response.status === 403) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      const result = await response.json();
      setEntries(result);
    } catch (error) {
      console.error('Error fetching KB:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (profile && profile.subscription_tier !== 'enterprise') {
        setForbidden(true);
        setLoading(false);
        return;
    }

    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('kb-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'knowledge_base' }, 
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const url = editingEntry 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/knowledge-base/${editingEntry.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/knowledge-base`;
      
      const method = editingEntry ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: user.id })
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingEntry(null);
        setFormData({ question: '', answer: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error saving KB entry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/knowledge-base/${id}?user_id=${user.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting KB entry:', error);
    }
  };

  if (forbidden || (profile && profile.subscription_tier !== 'enterprise')) {
    return (
      <PremiumGate 
        title="Knowledge Engine"
        description="Power your AI with custom documentation and automate support with high-fidelity suggested replies."
        features={[
            "Custom Knowledge Base Training",
            "AI Suggested Replies Integration",
            "Automated Documentation Sync",
            "Search Analytics for KB",
            "Multi-language Support"
        ]}
      />
    );
  }

  const filteredEntries = entries.filter(e => 
    e.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen font-sans selection:bg-primary/30 space-y-8 animate-in fade-in duration-700">
      <Breadcrumbs />

      <PageHeader 
        title="Knowledge Base" 
        description="Power the pulse of your AI by managing training data and common support answers."
      >
        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search entry..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
                />
            </div>
            <button 
                onClick={() => { setIsModalOpen(true); setEditingEntry(null); setFormData({ question: '', answer: '' }); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all"
            >
                <Plus size={18} />
                Add Entry
            </button>
        </div>
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => (
                <div key={entry.id} className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300 flex items-center gap-2">
                        <button 
                            onClick={() => { setEditingEntry(entry); setFormData({ question: entry.question, answer: entry.answer }); setIsModalOpen(true); }}
                            className="p-2 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 rounded-lg hover:text-primary transition-colors shadow-sm"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button 
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 rounded-lg hover:text-red-500 transition-colors shadow-sm"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg flex-shrink-0">
                            <Book size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight pr-8">{entry.question}</h4>
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-grow">
                        {entry.answer}
                    </p>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            ID: #{entry.id}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 italic">
                            {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden slide-in-from-bottom-4 animate-in duration-300">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {editingEntry ? 'Edit KB Entry' : 'Add New Entry'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question / Topic</label>
                        <input 
                            type="text" 
                            required
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            placeholder="e.g. How do I reset my password?"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Answer / Documentation</label>
                        <textarea 
                            required
                            rows={6}
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            placeholder="Provide a detailed answer or documentation link..."
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        />
                    </div>
                    
                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                            {editingEntry ? 'Update Entry' : 'Create Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
