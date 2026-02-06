import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TeamWorkloadProps {
  data: { name: string; count: number }[];
}

export default function TeamWorkload({ data }: TeamWorkloadProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const themeColors = Colors[colorScheme];
  const screenWidth = Dimensions.get('window').width;

  if (!data || data.length === 0) return null;

  // Take top 5 for better display on mobile
  const displayData = data.slice(0, 5);

  const chartData = {
    labels: displayData.map(d => d.name.split(' ')[0]),
    datasets: [
      {
        data: displayData.map(d => d.count)
      }
    ]
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>Team Workload</Text>
      
      <BarChart
        data={chartData}
        width={screenWidth - 64}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: themeColors.surface,
          backgroundGradientFrom: themeColors.surface,
          backgroundGradientTo: themeColors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => themeColors.primary,
          labelColor: (opacity = 1) => themeColors.icon,
          style: {
            borderRadius: 16
          }
        }}
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
  tooltip: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
