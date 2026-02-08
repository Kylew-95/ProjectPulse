import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, Lightbulb, Rocket, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

interface Suggestion {
  id: number;
  content: string;
  type: 'suggestion' | 'feature_request' | 'user_need';
  source_channel: string;
  created_at: string;
}

export default function AISuggestions() {
  const { profile } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = React.useCallback(async () => {
    if (!profile?.discord_guild_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('discord_guild_id', profile.discord_guild_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.discord_guild_id]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  if (!profile?.discord_guild_id) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature_request': return <Rocket size={16} color="#60a5fa" />;
      case 'user_need': return <ShieldCheck size={16} color="#34d399" />;
      default: return <Lightbulb size={16} color="#fbbf24" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };

  const getGradientColors = (type: string, isDark: boolean): [string, string] => {
    // Subtle gradients based on type
    if (isDark) {
        switch (type) {
            case 'feature_request': return ['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']; // Blue
            case 'user_need': return ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']; // Emerald
            default: return ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)']; // Amber
        }
    } else {
        return ['#ffffff', '#f8fafc'];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={18} color={colors.tint} style={styles.icon} />
          <Text style={[styles.title, { color: colors.text }]}>AI Insights</Text>
        </View>
        <TouchableOpacity onPress={fetchSuggestions} disabled={loading} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <RefreshCw size={14} color={colors.icon} style={loading ? styles.spinning : { opacity: 0.7 }} />
        </TouchableOpacity>
      </View>

      {loading && suggestions.length === 0 ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '10' }]}>
            <ActivityIndicator color={colors.tint} style={{ transform: [{ scale: 0.8 }] }} />
        </View>
      ) : suggestions.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={312} // card width + margin
          snapToAlignment="center"
        >
          {suggestions.map((item) => (
            <View 
                key={item.id} 
                style={[
                    styles.card, 
                    { 
                        backgroundColor: colors.surface, 
                        borderColor: colors.tabIconDefault + '15',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 5,
                    }
                ]}
            >
              <LinearGradient
                colors={getGradientColors(item.type, colorScheme === 'dark')}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              
              <View style={styles.cardHeader}>
                <View style={[styles.typeIcon, { backgroundColor: colors.background, borderColor: colors.tabIconDefault + '15' }]}>
                  {getTypeIcon(item.type)}
                </View>
                <View style={[styles.channelBadge, { backgroundColor: colors.background + '80' }]}>
                  <Text style={[styles.channelTag, { color: colors.icon }]}>#{item.source_channel || 'system'}</Text>
                </View>
              </View>

              <Text style={[styles.content, { color: colors.text }]} numberOfLines={3}>
                {item.content}
              </Text>

              <View style={[styles.cardFooter, { borderTopColor: colors.tabIconDefault + '10' }]}>
                <View style={[styles.typeBadge, { backgroundColor: colors.background + '80' }]}>
                  <Text style={styles.typeLabel}>{getTypeLabel(item.type)}</Text>
                </View>
                <Text style={[styles.date, { color: colors.icon }]}>
                  {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Lightbulb size={20} color={colors.icon} style={{ opacity: 0.5, marginBottom: 8 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No new insights</Text>
          <Text style={[styles.emptySubText, { color: colors.icon }]}>AI is listening to your channels...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  spinning: {
    transform: [{ rotate: '45deg' }], // Simple rotation for now, ideally use Reanimated for spin
  },
  loadingContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  scrollContent: {
    paddingRight: 20,
    paddingBottom: 20,
    paddingTop: 5,
  },
  card: {
    width: 290,
    height: 170,
    borderRadius: 20,
    marginRight: 12,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  channelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  channelTag: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    flex: 1,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyState: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3b82f6', // Distinct color to make it visible
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  emptySubText: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.6,
  }
});
