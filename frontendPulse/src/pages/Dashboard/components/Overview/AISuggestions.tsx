import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../../supabaseClient';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, RefreshCw, Lightbulb, Rocket, ShieldCheck, Trash2, Plus } from 'lucide-react';
import SubscriptionGate from '../../../../components/ui/SubscriptionGate';

interface Suggestion {
  id: number;
  content: string;
  type: 'suggestion' | 'feature_request' | 'user_need';
  source_channel: string;
  created_at: string;
}

const AISuggestions = ({ guildId, onCreateTicket }: { guildId: string | null, onCreateTicket?: (suggestion: Suggestion) => void }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!guildId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('discord_guild_id', guildId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    if (guildId) {
      fetchSuggestions();
    }
  }, [guildId, fetchSuggestions]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleDelete = async (id: number) => {
    // Optimistic update
    setSuggestions(prev => prev.filter(s => s.id !== id));
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
        // Revert if failed? (For now, just log and maybe refetch)
        fetchSuggestions();
      }
    } catch (err) {
      console.error('Error deleting suggestion:', err);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature_request': return 'Top Feature Request';
      case 'user_need': return 'User Pain Point';
      default: return 'Strategic Insight';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature_request': return <Rocket size={18} className="text-blue-400" />;
      case 'user_need': return <ShieldCheck size={18} className="text-emerald-400" />;
      default: return <Lightbulb size={18} className="text-amber-400" />;
    }
  };

  if (!guildId) return null;

  return (
    <div className="mt-8 flex flex-col gap-6 relative isolate border-2 border-dashed border-slate-300 dark:border-white/10 rounded-3xl p-6">
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-blue-500 animate-pulse" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">AI Insights & Trends</h2>
        </div>
        {!loading && suggestions.length > 0 && (
          <button 
            onClick={fetchSuggestions}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors group"
          >
            <RefreshCw size={16} className={`text-slate-400 group-hover:text-blue-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="relative z-0">
        <SubscriptionGate
          tier="enterprise"
          featureName="AI Insights"
          description="Unlock powerful intelligent recommendations and trend analysis tailored for your specific organizational data."
          features={[
            'Real-time AI-powered insights',
            'Predictive trend analysis',
            'Automated workflow optimization',
            'Smart resource allocation'
          ]}
        >
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          >
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="min-w-[300px] h-[200px] rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse border border-slate-200 dark:border-white/5 flex-shrink-0 snap-center" />
              ))
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="min-w-[320px] max-w-[320px] flex flex-col p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden h-full flex-shrink-0 snap-center"
                >
                  {/* Background gradient hint */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none z-0" />
                  
                  <div className="flex items-center justify-between mb-4 relative z-10 w-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group-hover:border-blue-500/30 transition-colors shadow-sm">
                        {getTypeIcon(suggestion.type)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        #{suggestion.source_channel || 'system'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onCreateTicket && (
                        <button 
                          onClick={() => onCreateTicket(suggestion)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1.5"
                          title="Convert to Ticket"
                        >
                          <Plus size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Ticket</span>
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(suggestion.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Insight"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-auto relative z-10 line-clamp-4">
                    {suggestion.content}
                  </p>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-1 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">
                        {getTypeLabel(suggestion.type)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(suggestion.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="w-full p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                <Lightbulb size={32} className="mx-auto text-slate-300 mb-4 opacity-50" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No insights generated yet.</p>
                <p className="text-xs text-slate-400 mt-2">Run `!pulse learn` in your Discord to generate new suggestions.</p>
              </div>
            )}
          </div>
        </SubscriptionGate>
      </div>
    </div>
  );
};

export default AISuggestions;
