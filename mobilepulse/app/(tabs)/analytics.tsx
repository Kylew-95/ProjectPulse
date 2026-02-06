import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalytics, TimeRange } from '@/hooks/useAnalytics';
import StatCard from '@/components/analytics/StatCard';
import VolumeChart from '@/components/analytics/VolumeChart';
import DistributionChart from '@/components/analytics/DistributionChart';
import TeamWorkload from '@/components/analytics/TeamWorkload';
import ActivityHeatmap from '@/components/analytics/ActivityHeatmap';
import { Ticket, AlertCircle, Zap, Activity } from 'lucide-react-native';

export default function Analytics() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  
  const { data, loading, refresh } = useAnalytics(timeRange);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerTitle: 'Analytics',
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
          headerRight: () => (
             <View style={styles.rangeSelector}>
               {(['7d', '30d', 'all'] as const).map((range) => (
                 <TouchableOpacity
                   key={range}
                   onPress={() => setTimeRange(range)}
                   style={[
                     styles.rangeButton,
                     timeRange === range && { backgroundColor: colors.primary }
                   ]}
                 >
                   <Text style={[
                     styles.rangeText,
                     { color: timeRange === range ? '#fff' : colors.icon }
                   ]}>
                     {range.toUpperCase()}
                   </Text>
                 </TouchableOpacity>
               ))}
             </View>
          ),
        }} 
      />

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Performance Overview</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>KEY METRICS & TRENDS</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
           <StatCard 
             title="Total Tickets" 
             value={data?.total.toString() || '0'} 
             trend={data?.trends.total}
             icon={Ticket}
             index={0}
           />
           <StatCard 
             title="Avg Urgency" 
             value={data?.urgency_avg.toFixed(1) || '0.0'} 
             trend={data?.trends.urgency}
             icon={AlertCircle}
             index={1}
           />
           <StatCard 
             title="Velocity (weekly)" 
             value={(data?.trends.velocity ? Math.round(data.total / (timeRange === '7d' ? 1 : 4)) : 0).toString()} 
             trend={data?.trends.velocity}
             icon={Zap}
             index={2}
           />
        </View>

        {/* Volume Chart */}
        {data?.daily_trends && (
            <VolumeChart data={data.daily_trends} timeRange={timeRange} />
        )}

        {/* Distributions */}
        <View style={styles.chartsRow}>
            {data?.by_priority && (
                <DistributionChart 
                    title="Priority" 
                    data={data.by_priority}
                    colorsMap={{
                        critical: '#ef4444',
                        high: '#f97316',
                        medium: '#fbbf24',
                        low: '#3b82f6'
                    }} 
                />
            )}
            
            {data?.by_status && (
                <DistributionChart 
                    title="Status" 
                    data={data.by_status} 
                    colorsMap={{
                        open: '#3b82f6',
                        'in progress': '#fbbf24',
                        resolved: '#10b981',
                        closed: '#64748b'
                    }}
                />
            )}

            {data?.workload && (
                <TeamWorkload data={data.workload} />
            )}

            {data?.heatmap && (
                <ActivityHeatmap data={data.heatmap} />
            )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  chartsRow: {
    gap: 16,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 8,
    padding: 2,
    marginRight: 16,
  },
  rangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
