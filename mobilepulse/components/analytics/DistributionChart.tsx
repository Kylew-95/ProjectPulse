import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DistributionChartProps {
  title: string;
  data: Record<string, number>;
  colorsMap?: Record<string, string>;
}

const DEFAULT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function DistributionChart({ title, data, colorsMap }: DistributionChartProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const themeColors = Colors[colorScheme];
  const screenWidth = Dimensions.get('window').width;

  if (!data || Object.keys(data).length === 0) {
     return null;
  }

  const chartData = Object.entries(data).map(([name, value], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    population: value,
    color: colorsMap?.[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    legendFontColor: themeColors.icon,
    legendFontSize: 12
  }));

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      
      <PieChart
        data={chartData}
        width={screenWidth - 64}
        height={220}
        chartConfig={{
          color: (opacity = 1) => themeColors.primary,
        }}
        accessor={"population"}
        backgroundColor={"transparent"}
        paddingLeft={"15"}
        center={[10, 0]}
        absolute
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
    marginBottom: 16,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendContainer: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
