import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface VolumeChartProps {
  data: { date: string; count: number }[];
  timeRange: string;
}

export default function VolumeChart({ data, timeRange }: VolumeChartProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const screenWidth = Dimensions.get('window').width;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Ticket Volume</Text>
        <View style={styles.emptyState}>
          <Text style={{ color: colors.icon }}>No data available</Text>
        </View>
      </View>
    );
  }

  const chartData = {
    labels: data.map(d => d.date.split('-')[2]), // Day of month
    datasets: [
      {
        data: data.map(d => d.count),
        color: (opacity = 1) => colors.primary, // optional
        strokeWidth: 2 // optional
      }
    ],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Ticket Volume</Text>
      
      <LineChart
        data={chartData}
        width={screenWidth - 64} // from react-native
        height={220}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => colors.primary,
          labelColor: (opacity = 1) => colors.icon,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: colors.primary
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  emptyState: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointerLabel: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
});
