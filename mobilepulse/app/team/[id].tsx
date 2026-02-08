import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Alert, Modal, FlatList, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Users, Mail, Shield, UserPlus, MoreVertical, Trash2, Search, X } from 'lucide-react-native';
import { TEAM_ROLES } from '@/constants/roles';
import { getCleanAvatarUrl } from '@/utils/image';

const ROLES = TEAM_ROLES.filter(r => r !== 'Admin').map(r => ({ label: r, value: r }));

const SUBSCRIPTION_LIMITS = {
  starter: { teams: 1, membersPerTeam: 3 },
  pro: { teams: 5, membersPerTeam: 10 },
  enterprise: { teams: Infinity, membersPerTeam: Infinity },
  super_admin: { teams: Infinity, membersPerTeam: Infinity },
};

type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS;

export default function TeamDetailScreen() {
  const { user, profile } = useAuth();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const fetchTeamDetails = useCallback(async () => {
    if (!id || !user) return;
    try {
      setLoading(true);
      // Fetch team info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', id)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('user_id, role')
        .eq('team_id', id);

      if (memberError) throw memberError;

      if (memberData && memberData.length > 0) {
        const userIds = memberData.map(m => m.user_id).filter(Boolean);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = profilesData?.reduce((acc: any, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        const membersWithProfiles = memberData.map(m => ({
          ...m,
          role: m.role,
          profiles: m.user_id ? profilesMap[m.user_id] : null
        }));
        setMembers(membersWithProfiles);
        
        const userMember = membersWithProfiles.find(m => m.user_id === user.id);
        setCurrentUserRole(userMember?.role?.toLowerCase() || null);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  const handleUpdateRole = async (memberUserId: string, newRole: string) => {
    try {
      if (newRole.toLowerCase() === 'admin') {
        const { data: adminExists } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', id)
          .ilike('role', 'admin')
          .neq('user_id', memberUserId)
          .maybeSingle();

        if (adminExists) {
          throw new Error('This team already has an Admin. Only one Admin is allowed.');
        }
      }

      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('team_id', id)
        .eq('user_id', memberUserId);

      if (error) throw error;
      
      setMembers(members.map(m => 
        m.user_id === memberUserId ? { ...m, role: newRole } : m
      ));
      
      Alert.alert('Success', 'Role updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('team_id', id)
                .eq('user_id', memberUserId);

              if (error) throw error;
              
              setMembers(members.filter(m => m.user_id !== memberUserId));
              Alert.alert('Success', 'Member removed');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const showMemberActions = (member: any) => {
    setSelectedMember(member);
    Alert.alert(
      'Manage Member',
      `Actions for ${member.profiles?.full_name || 'this user'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change Role', onPress: () => setIsRoleModalVisible(true) },
        { text: 'Remove from Team', style: 'destructive', onPress: () => handleRemoveMember(member.user_id) }
      ]
    );
  };

  const renderMemberItem = ({ item, index }: { item: any, index: number }) => {
    const isCurrentUser = item.user_id === user?.id;
    const avatarUrl = isCurrentUser ? (user?.user_metadata?.avatar_url || item.profiles?.avatar_url) : item.profiles?.avatar_url;
    const cleanUrl = getCleanAvatarUrl(avatarUrl);
    
    return (
      <View style={[styles.memberCard, { backgroundColor: colors.surface, borderBottomWidth: index === members.length - 1 ? 0 : 1, borderBottomColor: colors.tabIconDefault + '10' }]}>
        <View style={styles.memberInfo}>
            <View style={styles.headerTextContainer}>
                <View style={styles.nameRow}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                        {item.profiles?.full_name || 'Unknown User'}
                        {isCurrentUser && <Text style={{ color: colors.tint, fontSize: 12 }}> (You)</Text>}
                    </Text>
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
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint + '20' }]}>
                                <Text style={[styles.avatarText, { color: colors.tint }]}>
                                    {(item.profiles?.full_name || item.email || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.roleContainer}>
                    <Shield size={12} color={colors.icon} style={{ marginRight: 4 }} />
                    <Text style={[styles.memberRole, { color: colors.icon }]}>{item.role}</Text>
                </View>
            </View>
        </View>
        <View style={styles.memberActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Mail size={18} color={colors.icon} />
          </TouchableOpacity>
          
          {(currentUserRole === 'owner' || currentUserRole === 'admin') && !isCurrentUser && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => showMemberActions(item)}
            >
              <MoreVertical size={18} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const ListHeader = () => {
    // Determine member limits
    const tier = (profile?.subscription_tier?.toLowerCase() || 'starter') as SubscriptionTier;
    const limits = SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.starter;
    const maxMembers = limits.membersPerTeam;

    return (
      <>
        <View style={[styles.headerCard, { backgroundColor: colors.surface }]}>
           <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
              <Users size={32} color={colors.tint} />
           </View>
           <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Team Members ({members.length}/{maxMembers === Infinity ? '∞' : maxMembers})
        </Text>
      </>
    );
  };

  const ListFooter = () => (
    (currentUserRole === 'owner' || currentUserRole === 'admin') ? (
      <TouchableOpacity 
        style={[styles.deleteButton, { borderColor: '#ef4444' }]}
        onPress={() => {
          Alert.alert(
            'Delete Team',
            'Are you sure you want to permanently delete this team?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                  try {
                    const { error } = await supabase.from('teams').delete().eq('id', id);
                    if (error) throw error;
                    router.replace('/(tabs)/teams');
                  } catch (err: any) {
                    Alert.alert('Error', err.message);
                  }
                }
              }
            ]
          );
        }}
      >
        <Trash2 size={18} color="#ef4444" />
        <Text style={styles.deleteButtonText}>Delete Team</Text>
      </TouchableOpacity>
    ) : null
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!team) {
      return (
          <View style={[styles.center, { backgroundColor: colors.background }]}>
              <Text style={{ color: colors.text }}>Team not found.</Text>
          </View>
      );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: team.name, 
        headerTintColor: colors.text, 
        headerStyle: { backgroundColor: colors.surface },
        headerRight: () => {
          const tier = (profile?.subscription_tier?.toLowerCase() || 'starter') as SubscriptionTier;
          const limits = SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.starter;
          const maxMembers = limits.membersPerTeam;
          const canInvite = members.length < maxMembers;

          return (currentUserRole === 'owner' || currentUserRole === 'admin') && (
            canInvite ? (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/team/invite', params: { teamId: id } })}
                style={{ marginRight: 10 }}
              >
                <UserPlus size={22} color={colors.tint} />
              </TouchableOpacity>
            ) : (
              <View style={{ marginRight: 10, opacity: 0.5 }}>
                 <UserPlus size={22} color={colors.icon} />
              </View>
            )
          );
        }
      }} />
      
      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      <Modal
        visible={isRoleModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Role</Text>
              <TouchableOpacity onPress={() => setIsRoleModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
              <Search size={18} color={colors.icon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search roles..."
                placeholderTextColor={colors.icon}
                value={roleSearch}
                onChangeText={setRoleSearch}
              />
            </View>

            <FlatList
              data={ROLES.filter(r => r.label.toLowerCase().includes(roleSearch.toLowerCase()))}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.roleItem, { borderBottomColor: colors.tabIconDefault + '10' }]}
                  onPress={() => {
                    if (selectedMember) {
                      handleUpdateRole(selectedMember.user_id, item.value);
                    }
                    setIsRoleModalVisible(false);
                    setRoleSearch('');
                  }}
                >
                  <Text style={[styles.roleItemText, { color: colors.text, fontWeight: selectedMember?.role === item.value ? 'bold' : 'normal' }]}>
                    {item.label}
                  </Text>
                  {selectedMember?.role === item.value && <Shield size={16} color={colors.tint} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  headerCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
      flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginLeft: 6,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberRole: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 40,
    marginBottom: 40,
    gap: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  roleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  roleItemText: {
    fontSize: 16,
  },
});
