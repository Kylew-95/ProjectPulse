import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, User } from 'lucide-react-native';
import { getCleanAvatarUrl } from '@/utils/image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CommandHeader() {
  const { profile, user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const userName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const plan = profile?.subscription_tier || 'Starter';

  // Capitalize plan
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);

  const finalAvatarUrl = getCleanAvatarUrl(profile?.avatar_url) || getCleanAvatarUrl(user?.user_metadata?.avatar_url);

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.textContainer}>
          <Text style={[styles.greeting, { color: colors.icon }]}>Welcome back,</Text>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{userName}</Text>
            <View style={styles.avatarWrapper}>
              {finalAvatarUrl ? (
                <Image 
                  source={{ uri: finalAvatarUrl }} 
                  style={styles.avatar}
                  transition={200}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint + '20' }]}>
                  <User size={16} color={colors.tint} />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b40' }]}>
         <Sparkles size={12} color="#f59e0b" style={{ marginRight: 4 }} />
         <Text style={styles.badgeText}>{planDisplay}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginLeft: 8,
  },
  textContainer: {
    flexShrink: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  }
  ,
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  }
});
