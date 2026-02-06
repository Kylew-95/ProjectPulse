import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChevronRight, Users, Plus } from 'lucide-react-native';
import { router } from 'expo-router';

interface Team {
  id: string;
  name: string;
}

export default function TeamsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select(`
            team_id,
            teams (
              id,
              name
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        
        if (data) {
          const formattedTeams = data
            .map(item => item.teams)
            .filter(Boolean)
            .map(t => Array.isArray(t) ? t[0] : t) as unknown as Team[];
          
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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.heading, { color: colors.text }]}>Teams</Text>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/team/create')}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>New Team</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.teamCard, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '20' }]}
            onPress={() => router.push({ pathname: '/team/[id]', params: { id: item.id } })}
          >
            <View style={styles.teamInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '10' }]}>
                <Users size={20} color={colors.tint} />
              </View>
              <View>
                <Text style={[styles.teamName, { color: colors.text }]}>{item.name}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
  },
  teamDesc: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
