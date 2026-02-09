import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/ui/Avatar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChevronRight, Users, Plus } from 'lucide-react-native';
import { router } from 'expo-router';

interface Team {
  id: string;
  name: string;
  member_count?: number;
  members?: {
    avatar_url: string | null;
    full_name: string | null;
  }[];
}

const SUBSCRIPTION_LIMITS = {
  starter: { teams: 1, membersPerTeam: 3 },
  pro: { teams: 5, membersPerTeam: 10 },
  enterprise: { teams: Infinity, membersPerTeam: Infinity },
  super_admin: { teams: Infinity, membersPerTeam: Infinity }, // Fallback for super_admin
};

type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS;

export default function TeamsScreen() {
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [teams, setTeams] = useState<Team[]>([]);

  const [loading, setLoading] = useState(true);

  // Access Control
  const isAuthorized = ['pro', 'enterprise', 'super_admin'].includes(profile?.subscription_tier?.toLowerCase() || '');

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return;
      try {
        // Step 1: Fetch teams and their members (user_ids only)
        const { data, error } = await supabase
          .from('team_members')
          .select(`
            team_id,
            teams (
              id,
              name,
              team_members:team_members(
                user_id
              )
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        
        if (data) {
          const rawTeams = data
            .map(item => item.teams)
            .filter(Boolean)
            .map(t => Array.isArray(t) ? t[0] : t);

          // Step 2: Extract all unique user IDs across all teams
          const allUserIds = Array.from(new Set(
            rawTeams.flatMap(t => t.team_members?.map((tm: any) => tm.user_id) || [])
          ));

          // Step 3: Fetch profiles for these users
          let profilesMap: Record<string, { avatar_url: string | null, full_name: string | null }> = {};
          
          if (allUserIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', allUserIds);
              
            if (profilesError) throw profilesError;

            if (profilesData) {
              profilesMap = profilesData.reduce((acc, profile) => {
                acc[profile.id] = profile;
                return acc;
              }, {} as Record<string, typeof profilesData[0]>);
            }
          }

          // Step 4: Map profiles back to teams
          const formattedTeams = rawTeams.map(team => {
            const members = team.team_members?.map((tm: any) => {
              const profile = profilesMap[tm.user_id];

              return {
                ...profile,
                user_id: tm.user_id
              };
            }).filter((m: any) => m.full_name || m.avatar_url) || [];

            return { 
              ...team, 
              member_count: members.length,
              members: members
            };
          }) as unknown as Team[];
          
          setTeams(formattedTeams);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();

  }, [user]);

  if (!isAuthorized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <PremiumGate isAuthorized={false} featureName="Teams & Collaboration">
          <></>
        </PremiumGate>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  // Determine limits
  const tier = (profile?.subscription_tier?.toLowerCase() || 'starter') as SubscriptionTier;
  const limits = SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.starter;
  const maxTeams = limits.teams;
  const canCreateTeam = teams.length < maxTeams;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>Teams</Text>
              <Text style={{ color: colors.icon, fontSize: 14, marginTop: 4 }}>
                {teams.length} / {maxTeams === Infinity ? '∞' : maxTeams} Active {teams.length === 1 ? 'Team' : 'Teams'}
              </Text>
            </View>
            {canCreateTeam ? (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/team/create')}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>New Team</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.createButton, { backgroundColor: colors.tabIconDefault + '40' }]}>
                <Text style={[styles.createButtonText, { color: colors.icon }]}>Limit Reached</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.teamCard, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '20' }]}
            onPress={() => router.push({ pathname: '/team/[id]', params: { id: item.id } })}
          >
            <View style={styles.teamHeaderRow}>
               <View style={styles.teamTitleRow}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.tint + '10' }]}>
                    <Users size={18} color={colors.tint} />
                  </View>
                  <Text style={[styles.teamName, { color: colors.text }]}>{item.name}</Text>
               </View>
               <ChevronRight size={18} color={colors.icon} />
            </View>

            <View style={styles.membersRow}>
              <View style={styles.avatarStack}>
                {item.members?.slice(0, 4).map((member, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.avatarBorder, 
                      { 
                        borderColor: colors.surface,
                        zIndex: 4 - index,
                        marginLeft: index === 0 ? 0 : -10 
                      }
                    ]}
                  >
                    <Avatar 
                      url={member.avatar_url} 
                      name={member.full_name} 
                      size={28} 
                    />
                  </View>
                ))}
                {(item.members?.length || 0) > 4 && (
                  <View 
                    style={[
                      styles.avatarBorder, 
                      { 
                        borderColor: colors.surface,
                        zIndex: 0,
                        marginLeft: -10 
                      }
                    ]}
                  >
                    <View style={[styles.overflowBadge, { backgroundColor: colors.background }]}>
                      <Text style={[styles.overflowText, { color: colors.icon }]}>
                        +{item.members!.length - 4}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <Text style={[styles.memberCountLabel, { color: colors.icon }]}>
                {item.member_count} members
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.icon }]}>No teams found.</Text>
        }
      />
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
  listContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  teamCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  teamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorder: {
    borderWidth: 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  overflowBadge: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overflowText: {
    fontSize: 10,
    fontWeight: '700',
  },
  memberCountLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
