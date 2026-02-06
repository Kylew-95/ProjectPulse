import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ActivityHeatmapProps {
  data: { day: string; hour: number; count: number }[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [9, 12, 15, 18, 21]; // Simplified hour labels

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const themeColors = Colors[colorScheme];

  if (!data || data.length === 0) return null;

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(150, 150, 150, 0.05)';
    if (count < 2) return 'rgba(59, 130, 246, 0.3)';
    if (count < 5) return 'rgba(59, 130, 246, 0.6)';
    return 'rgba(59, 130, 246, 1)';
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>Activity Heatmap</Text>
      
      <View style={styles.gridContainer}>
        {/* Hour Labels */}
        <View style={styles.headerRow}>
          <View style={styles.dayLabel} />
          {HOURS.map(h => (
            <Text key={h} style={[styles.hourLabel, { color: themeColors.icon }]}>{h}h</Text>
          ))}
        </View>

        {DAYS.map(day => (
          <View key={day} style={styles.dayRow}>
            <Text style={[styles.dayName, { color: themeColors.icon }]}>{day}</Text>
            <View style={styles.squaresRow}>
              {/* Filter data for this day and map to 24 slots, but we can visualize in chunks or raw */}
              {Array.from({ length: 24 }).map((_, hour) => {
                const entry = data.find(d => d.day === day && d.hour === hour);
                return (
                  <View 
                    key={hour} 
                    style={[
                      styles.square, 
                      { backgroundColor: getColor(entry?.count || 0) }
                    ]} 
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: themeColors.icon }]}>Less</Text>
        {[0, 1, 3, 6].map(c => (
          <View key={c} style={[styles.legendSquare, { backgroundColor: getColor(c) }]} />
        ))}
        <Text style={[styles.legendText, { color: themeColors.icon }]}>More</Text>
      </View>
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
  gridContainer: {
    paddingRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabel: {
    width: 35,
  },
  hourLabel: {
    flex: 1,
    fontSize: 9,
    textAlign: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    height: 12,
  },
  dayName: {
    width: 35,
    fontSize: 10,
    fontWeight: '500',
  },
  squaresRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'space-between',
  },
  square: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    marginHorizontal: 4,
  },
});
