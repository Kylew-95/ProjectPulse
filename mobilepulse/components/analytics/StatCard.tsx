import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ElementType;
  index?: number;
}

export default function StatCard({ title, value, trend, trendLabel, icon: Icon, index = 0 }: StatCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withSpring(1));
    translateY.value = withDelay(index * 100, withSpring(0));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const trendColor = trend && trend > 0 ? '#10b981' : trend && trend < 0 ? '#ef4444' : colors.text;
  const TrendIcon = trend && trend > 0 ? ArrowUpRight : trend && trend < 0 ? ArrowDownRight : Minus;

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, animatedStyle]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.icon }]}>{title}</Text>
        {Icon && <Icon size={16} color={colors.icon} />}
      </View>
      
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      
      {trend !== undefined && (
        <View style={styles.trendContainer}>
          <TrendIcon size={16} color={trendColor} />
          <Text style={[styles.trendValue, { color: trendColor }]}>
            {Math.abs(trend).toFixed(1)}%
          </Text>
          {trendLabel && (
            <Text style={[styles.trendLabel, { color: colors.icon }]}>{trendLabel}</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
});
