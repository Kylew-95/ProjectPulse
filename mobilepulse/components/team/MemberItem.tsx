import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getCleanAvatarUrl } from '@/utils/image';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MemberItemProps {
  member: {
    user_id?: string;
    role: string;
    status: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
      email: string | null;
    } | null;
    email: string;
  };
}

export default function MemberItem({ member }: MemberItemProps) {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const isCurrentUser = member.user_id === user?.id;
  const name = member.profiles?.full_name || member.email;
  const initial = name?.charAt(0).toUpperCase() || '?';
  const avatarUrl = (isCurrentUser ? user?.user_metadata?.avatar_url : null) || member.profiles?.avatar_url;
  const cleanUrl = getCleanAvatarUrl(avatarUrl);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '20' }]}>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <View style={styles.avatarWrapper}>
              {cleanUrl ? (
                  <Image 
                    source={{ uri: cleanUrl }} 
                    style={styles.avatar}
                    transition={200}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
              ) : (
                  <View style={[styles.placeholderAvatar, { backgroundColor: colors.tint + '20' }]}>
                      <Text style={[styles.initial, { color: colors.tint }]}>{initial}</Text>
                  </View>
              )}
          </View>
        </View>
        <Text style={[styles.role, { color: colors.icon }]}>{member.role} • {member.status}</Text>
      </View>
      
      <Ionicons name="ellipsis-horizontal" size={20} color={colors.icon} style={{ marginLeft: 12 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  avatarWrapper: {
    marginLeft: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  placeholderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  role: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
