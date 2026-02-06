import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import CommandHeader from '@/components/overview/CommandHeader';
import PremiumStatCard from '@/components/overview/PremiumStatCard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LayoutDashboard, Settings as SettingsIcon } from 'lucide-react-native';
import { router } from 'expo-router';

export default function OverviewScreen() {
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, avgUrgency: 0 });
  const [refreshing, setRefreshing] = useState(false);


  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('tickets').select('status, urgency_score');
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

        <View style={styles.grid}>
          <PremiumStatCard 
            title="Total Operations" 
            value={stats.total} 
            iconName="ticket-outline" 
            color={colors.tint} 
            trend="↑ 12%"
          />
          <PremiumStatCard 
            title="Active Issues" 
            value={stats.open} 
            iconName="pulse-outline" 
            color="#f59e0b" 
            trend="↓ 5%"
            trendIsPositive={false}
          />
          <PremiumStatCard 
            title="Success Rate" 
            value={`${resolutionRate.toFixed(0)}%`} 
            iconName="shield-checkmark-outline" 
            color={colors.secondary} 
            trend="Optimal"
          />
        </View>

        {/* System Intelligence Section */}
        <View style={[styles.intelligenceSection, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '10' }]}>
          <View style={styles.intelligenceHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.intelligenceTitle, { color: colors.text }]}>System Intelligence</Text>
              <Text style={[styles.intelligenceSubtitle, { color: colors.icon }]}>
                Monitoring automated urgency scoring and team analytics
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/analytics')}
              style={[styles.analyticsLink, { borderColor: colors.primary + '30' }]}
            >
              <Text style={[styles.analyticsLinkText, { color: colors.primary }]}>View Detailed</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricsGrid}>
            {/* Utility Load */}
            <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.tabIconDefault + '10' }]}>
              <Text style={[styles.metricLabel, { color: colors.icon }]}>UTILITY LOAD</Text>
              <View style={styles.metricValue}>
                <Text style={[styles.metricNumber, { color: colors.text }]}>
                  {Math.min(stats.avgUrgency * 10, 100).toFixed(1)}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.icon }]}>%</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.tabIconDefault + '20' }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: '#3b82f6',
                      width: `${Math.min(stats.avgUrgency * 10, 100)}%`
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Resolution Velocity */}
            <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.tabIconDefault + '10' }]}>
              <Text style={[styles.metricLabel, { color: colors.icon }]}>RESOLUTION VELOCITY</Text>
              <View style={styles.metricValue}>
                <Text style={[styles.metricNumber, { color: colors.text }]}>
                  {resolutionRate.toFixed(1)}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.icon }]}>%</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.tabIconDefault + '20' }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: '#10b981',
                      width: `${resolutionRate}%`
                    }
                  ]} 
                />
              </View>
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  grid: {
    gap: 16,
    marginBottom: 24,
  },
  intelligenceSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  intelligenceHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intelligenceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  intelligenceSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  analyticsLink: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  analyticsLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '600',
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
