import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Check, AlertCircle } from 'lucide-react-native';

const PRIORITIES = [
  { label: 'Low', value: 'low', color: '#10b981' },
  { label: 'Medium', value: 'medium', color: '#f59e0b' },
  { label: 'High', value: 'high', color: '#ef4444' },
  { label: 'Urgent', value: 'urgent', color: '#7c3aed' },
];

export default function CreateTicketScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(false);
  const [fetchingTeams, setFetchingTeams] = useState(true);
  const [userTeams, setUserTeams] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    team_id: '',
  });

  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('team_id, teams(id, name)')
          .eq('user_id', user.id);

        if (error) throw error;

        const teams = data?.map(m => {
          const t = Array.isArray(m.teams) ? m.teams[0] : m.teams;
          return { id: t.id, name: t.name };
        }) || [];

        setUserTeams(teams);
        if (teams.length > 0) {
          setFormData(prev => ({ ...prev, team_id: teams[0].id }));
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setFetchingTeams(false);
      }
    };

    fetchUserTeams();
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.team_id) {
      Alert.alert('Error', 'Please fill in the title and select a team.');
      return;
    }

    setLoading(true);
    try {
      // Get the highest position in the team to place this at the end
      const { data: posData } = await supabase
        .from('tickets')
        .select('position')
        .eq('team_id', formData.team_id)
        .order('position', { ascending: false })
        .limit(1);
      
      const nextPosition = (posData?.[0]?.position || 0) + 1000;

      // Auto-assignment logic
      let assignee_id = null;
      try {
        // 1. Get all members of the selected team
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', formData.team_id);

        if (teamMembers && teamMembers.length > 0) {
          const memberIds = teamMembers.map(m => m.user_id);

          // 2. Get active ticket counts for these members
          const { data: activeTickets } = await supabase
            .from('tickets')
            .select('assignee_id')
            .in('assignee_id', memberIds)
            .in('status', ['open', 'in_progress']);

          const workload: Record<string, number> = {};
          memberIds.forEach(id => workload[id] = 0);

          activeTickets?.forEach(t => {
            if (t.assignee_id) {
              workload[t.assignee_id] = (workload[t.assignee_id] || 0) + 1;
            }
          });

          // 3. Find member with lowest workload
          // Sort or reduce to find min
          assignee_id = memberIds.reduce((minId, currentId) => {
            return workload[currentId] < workload[minId] ? currentId : minId;
          }, memberIds[0]);


        }
      } catch (err) {
        console.warn('Auto-assignment failed, proceeding with null assignee', err);
      }

      const { error } = await supabase
        .from('tickets')
        .insert({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: 'open',
          team_id: formData.team_id,
          reporter_id: user?.id,
          assignee_id: assignee_id, // Auto-assigned
          position: nextPosition,
          urgency_score: 0,
        });

      if (error) throw error;

      Alert.alert('Success', 'Ticket created successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingTeams) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Create Ticket',
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.surface } 
      }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.icon }]}>Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.tabIconDefault + '20' }]}
            placeholder="What needs to be done?"
            placeholderTextColor={colors.icon + '80'}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.icon }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.tabIconDefault + '20' }]}
            placeholder="Add some details..."
            placeholderTextColor={colors.icon + '80'}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.icon }]}>Priority</Text>
          <View style={styles.priorityGrid}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityCard,
                  { backgroundColor: colors.surface, borderColor: formData.priority === p.value ? p.color : colors.tabIconDefault + '10' },
                  formData.priority === p.value && { backgroundColor: p.color + '15' }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, priority: p.value }))}
              >
                <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                <Text style={[styles.priorityLabel, { color: formData.priority === p.value ? p.color : colors.text }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.icon }]}>Team</Text>
          {userTeams.length > 0 ? (
            <View style={styles.teamList}>
              {userTeams.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.teamItem,
                    { backgroundColor: colors.surface, borderColor: formData.team_id === t.id ? colors.tint : colors.tabIconDefault + '10' }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, team_id: t.id }))}
                >
                  <Text style={[styles.teamItemText, { color: colors.text }]}>{t.name}</Text>
                  {formData.team_id === t.id && <Check size={18} color={colors.tint} />}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.warningBox, { backgroundColor: '#ef444415' }]}>
              <AlertCircle size={20} color="#ef4444" />
              <Text style={{ color: '#ef4444', flex: 1, marginLeft: 8 }}>
                You must be a member of at least one team to create a ticket.
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton, 
            { backgroundColor: colors.tint },
            (loading || userTeams.length === 0) && { opacity: 0.6 }
          ]}
          onPress={handleSubmit}
          disabled={loading || userTeams.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Ticket</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  priorityCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamList: {
    gap: 8,
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  teamItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  submitButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
