import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../../supabaseClient';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Lightbulb, Rocket, ShieldCheck } from 'lucide-react';
import SubscriptionGate from '../../../../components/ui/SubscriptionGate';

interface Suggestion {
  id: number;
  content: string;
  type: 'suggestion' | 'feature_request' | 'user_need';
  source_channel: string;
  created_at: string;
}

const AISuggestions = ({ guildId }: { guildId: string | null }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!guildId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('guild_id', guildId)
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature_request': return <Rocket size={18} className="text-blue-400" />;
      case 'user_need': return <ShieldCheck size={18} className="text-emerald-400" />;
      default: return <Lightbulb size={18} className="text-amber-400" />;
    }
  };

  if (!guildId) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse border border-slate-200 dark:border-white/5" />
            ))
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Background gradient hint */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group-hover:border-blue-500/30 transition-colors">
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    #{suggestion.source_channel || 'system'}
                  </span>
                </div>
                
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                  {suggestion.content}
                </p>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    {suggestion.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(suggestion.created_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="md:col-span-3 p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/5">
              <Lightbulb size={32} className="mx-auto text-slate-300 mb-4 opacity-50" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No insights generated yet.</p>
              <p className="text-xs text-slate-400 mt-2">Run `!pulse learn` in your Discord to generate new suggestions.</p>
            </div>
          )}
        </div>
      </SubscriptionGate>
    </div>
  );
};

export default AISuggestions;
