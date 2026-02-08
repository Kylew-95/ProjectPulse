import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import CommandHeader from '@/components/overview/CommandHeader';
import PremiumStatCard from '@/components/overview/PremiumStatCard';
import AISuggestions from '@/components/overview/AISuggestions';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LayoutDashboard, Settings as SettingsIcon } from 'lucide-react-native';
import { router } from 'expo-router';

export default function OverviewScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, avgUrgency: 0 });
  const [refreshing, setRefreshing] = useState(false);


  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('tickets').select('status, urgency_score');
      if (data) {
        const total = data.length;
        const closed = data.filter(t => (t.status === 'done' || t.status === 'closed')).length;
        const open = total - closed;
        const avgUrgency = total > 0 
          ? data.reduce((acc, t) => acc + (t.urgency_score || 0), 0) / total 
          : 0;
        
        setStats({ total, open, closed, avgUrgency });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('overview-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const resolutionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topHeader}>
        <View style={styles.headerInfo}>
           <LayoutDashboard size={20} color={colors.tint} style={{ marginRight: 8 }} />
           <Text style={[styles.headerText, { color: colors.text }]}>Dashboard</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/settings')}
          style={[styles.settingsButton, { backgroundColor: colors.surface }]}
        >
          <SettingsIcon size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} colors={[colors.tint]} />
        }
      >
        <CommandHeader />

        {/* AI Insights Section */}
        <AISuggestions />

        {/* Quick Stats - Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Stats</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.statsScroll}
          style={styles.statsContainer}
        >
          <PremiumStatCard 
            title="Total Operations" 
            value={stats.total} 
            iconName="ticket-outline" 
            color={colors.tint} 
            trend="12%"
            style={styles.squareCard}
          />
          <PremiumStatCard 
            title="Active Issues" 
            value={stats.open} 
            iconName="pulse-outline" 
            color="#f59e0b" 
            trend="5%"
            trendIsPositive={false}
            style={styles.squareCard}
          />
          <PremiumStatCard 
            title="Success Rate" 
            value={`${resolutionRate.toFixed(0)}%`} 
            iconName="shield-checkmark-outline" 
            color={resolutionRate >= 70 ? colors.secondary : resolutionRate >= 40 ? "#f59e0b" : "#ef4444"} 
            trend={resolutionRate >= 70 ? "High" : resolutionRate >= 40 ? "Mid" : "Low"}
            style={styles.squareCard}
          />
        </ScrollView>

        {/* System Intelligence - Hero Card */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>System Health</Text>
          <TouchableOpacity onPress={() => router.push('/analytics')}>
            <Text style={{ color: colors.tint, fontSize: 13, fontWeight: '600' }}>View Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '20' }]}>
            <View style={styles.heroHeader}>
                <View style={[styles.heroIcon, { backgroundColor: colors.tint + '15' }]}>
                    <LayoutDashboard size={24} color={colors.tint} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>Intelligence Overview</Text>
                    <Text style={[styles.heroSubtitle, { color: colors.icon }]}>System operating at normal capacity</Text>
                </View>
            </View>

            <View style={styles.heroMetrics}>
                <View style={styles.heroMetricItem}>
                    <Text style={[styles.heroMetricLabel, { color: colors.icon }]}>UTILITY LOAD</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${Math.min(stats.avgUrgency * 10, 100)}%`, backgroundColor: '#3b82f6' }]} />
                    </View>
                    <Text style={[styles.heroMetricValue, { color: colors.text }]}>{Math.min(stats.avgUrgency * 10, 100).toFixed(0)}%</Text>
                </View>
                
                <View style={styles.heroDivider} />

                <View style={styles.heroMetricItem}>
                    <Text style={[styles.heroMetricLabel, { color: colors.icon }]}>VELOCITY</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${resolutionRate}%`, backgroundColor: '#10b981' }]} />
                    </View>
                    <Text style={[styles.heroMetricValue, { color: colors.text }]}>{resolutionRate.toFixed(0)}%</Text>
                </View>
            </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsScroll: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  statsContainer: {
    flexGrow: 0,
  },
  squareCard: {
    width: 150,
    height: 150,
    marginRight: 12,
    marginBottom: 0,
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  heroMetrics: {
    gap: 16,
  },
  heroMetricItem: {
    gap: 8,
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginVertical: 4,
  },
});

