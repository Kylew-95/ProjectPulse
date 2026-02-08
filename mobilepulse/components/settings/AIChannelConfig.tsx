import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Sparkles, Check, ChevronDown, Lock, Loader2 } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { getApiUrl } from '@/utils/apiConfig';

interface Channel {
  id: string;
  name: string;
}

export default function AIChannelConfig() {
  const { profile } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  const isEnterprise = ['enterprise', 'super_admin'].includes(profile?.subscription_tier?.toLowerCase() || '');

  useEffect(() => {
    if (profile?.discord_channel_id) {
      setSelectedChannelId(profile.discord_channel_id);
    }
  }, [profile]);

  const fetchChannels = async () => {
    if (!profile?.discord_guild_id) return;
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/discord/channels/${profile.discord_guild_id}`);
      const data = await response.json();
      if (data.channels) {
        setChannels(data.channels);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      Alert.alert('Error', 'Failed to load Discord channels');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChannel = async (channelId: string) => {
    if (!profile?.discord_guild_id) return;
    setSaving(true);
    try {
      const response = await fetch(`${getApiUrl()}/discord/learning-channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guild_id: profile.discord_guild_id,
          channel_id: channelId
        })
      });
      
      if (response.ok) {
        setSelectedChannelId(channelId);
        setModalVisible(false);
        Alert.alert('Success', 'AI learning channel updated');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving channel:', error);
      Alert.alert('Error', 'Failed to save channel selection');
    } finally {
      setSaving(false);
    }
  };

  const selectedChannelName = channels.find(c => c.id === selectedChannelId)?.name || 'Select a channel...';

  if (!profile?.discord_guild_id) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '20' }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={16} color={colors.primary} style={styles.icon} />
          <Text style={[styles.title, { color: colors.text }]}>AI Learning Configuration</Text>
          {isEnterprise && (
            <View style={[styles.badge, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b40' }]}>
               <Text style={[styles.badgeText, { color: '#f59e0b' }]}>ENTERPRISE</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.description, { color: colors.icon }]}>
        Choose the channel where Pulse should listen for messages to learn from.
      </Text>

      {!isEnterprise ? (
        <View style={[styles.lockedContainer, { backgroundColor: '#f59e0b10', borderColor: '#f59e0b30' }]}>
            <Lock size={16} color="#f59e0b" style={{ marginBottom: 8 }} />
            <Text style={[styles.lockedText, { color: colors.text }]}>Enterprise Feature</Text>
            <Text style={[styles.lockedSubtext, { color: colors.icon }]}>Upgrade to configure AI learning channels.</Text>
        </View>
      ) : (
        <TouchableOpacity 
            style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.tabIconDefault + '30' }]}
            onPress={fetchChannels}
            disabled={loading}
        >
            <Text style={{ color: selectedChannelId ? colors.text : colors.icon }}>
                {selectedChannelId ? `#${selectedChannelName}` : 'Select a channel...'}
            </Text>
            {loading ? <Loader2 size={16} color={colors.icon} style={{ transform: [{ rotate: '45deg' }] }} /> : <ChevronDown size={16} color={colors.icon} />}
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.tabIconDefault + '20' }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Select Channel</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Close</Text>
                    </TouchableOpacity>
                </View>
                {saving ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.icon }]}>Saving...</Text>
                    </View>
                ) : (
                    <FlatList 
                        data={channels}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[
                                    styles.channelItem, 
                                    { borderBottomColor: colors.tabIconDefault + '10' },
                                    item.id === selectedChannelId && { backgroundColor: colors.primary + '10' }
                                ]}
                                onPress={() => handleSaveChannel(item.id)}
                            >
                                <Text style={[styles.channelName, { color: item.id === selectedChannelId ? colors.primary : colors.text }]}>
                                    #{item.name}
                                </Text>
                                {item.id === selectedChannelId && <Check size={16} color={colors.primary} />}
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  lockedContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  lockedSubtext: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '50%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  }
});
