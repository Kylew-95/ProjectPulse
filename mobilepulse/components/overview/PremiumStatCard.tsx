import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  trend: string;
  trendIsPositive?: boolean;
}

export default function PremiumStatCard({
  title,
  value,
  iconName,
  color,
  trend,
  trendIsPositive = true,
}: PremiumStatCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '20' }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}> 
          <Ionicons name={iconName} size={20} color={color} />
        </View>
        <Text style={[styles.trend, { color: trendIsPositive ? colors.secondary : '#ef4444' }]}>
          {trend}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.title, { color: colors.icon }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
  },
});
