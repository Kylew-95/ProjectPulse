import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { Shield, ChevronDown, Check, User, Trash } from 'lucide-react-native';
import { Image } from 'expo-image';
import { getCleanAvatarUrl } from '@/utils/image';
import CommentList from '@/components/tickets/CommentList';

const STATUS_OPTIONS = [
  { label: 'Open', value: 'open', color: '#10b981' },
  { label: 'In Progress', value: 'in_progress', color: '#3b82f6' },
  { label: 'Review', value: 'review', color: '#f59e0b' },
  { label: 'Done', value: 'done', color: '#64748b' },
];

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low', color: '#10b981' },
  { label: 'Medium', value: 'medium', color: '#f59e0b' },
  { label: 'High', value: 'high', color: '#ef4444' },
  { label: 'Urgent', value: 'urgent', color: '#7c3aed' },
];

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isPriorityModalVisible, setIsPriorityModalVisible] = useState(false);
  const [isAssigneeModalVisible, setIsAssigneeModalVisible] = useState(false);
  const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<any[]>([]);

  const fetchTicketDetails = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assignee_profile:profiles!tickets_assignee_id_fkey(full_name, avatar_url, email),
          reporter_profile:profiles!tickets_reporter_id_fkey(full_name, avatar_url, email),
          teams(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTeamMembers = useCallback(async () => {
    if (!ticket?.team_id) return;
    try {
      // Step 1: Fetch members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', ticket.team_id);

      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) {
        setTeamMembers([]);
        return;
      }

      const userIds = memberData.map(m => m.user_id);

      // Step 2: Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      
      setTeamMembers(profilesData || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  }, [ticket?.team_id]);

  const fetchUserTeams = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams(id, name)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const teams = data?.map((item: any) => item.teams).filter(Boolean) || [];
      setUserTeams(teams);
    } catch (err) {
      console.error('Error fetching user teams:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchUserTeams();
  }, [fetchUserTeams]);

  useEffect(() => {
    if (ticket) {
      fetchTeamMembers();
    }
  }, [ticket, fetchTeamMembers]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  const updateTicket = async (updates: any) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setTicket((prev: any) => ({ ...prev, ...updates }));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Ticket',
      'Are you sure you want to delete this ticket? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from('tickets')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              
              router.back();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete ticket: ' + err.message);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Ticket not found.</Text>
      </View>
    );
  }

  const assigneeAvatar = getCleanAvatarUrl(ticket.assignee_profile?.avatar_url);
  const reporterAvatar = getCleanAvatarUrl(ticket.reporter_profile?.avatar_url);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: `Ticket #${id.toString().slice(-4)}`,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.surface },
        headerRight: () => (
          <TouchableOpacity onPress={handleDelete}>
            <Trash size={24} color={colors.error} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{ticket.title}</Text>
          <View style={styles.metaRow}>
            <TouchableOpacity 
              style={[styles.badge, { backgroundColor: colors.tint + '15' }]}
              onPress={() => setIsTeamModalVisible(true)}
            >
               <Shield size={12} color={colors.tint} style={{ marginRight: 4 }} />
               <Text style={[styles.badgeText, { color: colors.tint }]}>
                 {ticket.teams?.name || 'No Team'}
               </Text>
               <ChevronDown size={12} color={colors.tint} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <Text style={[styles.dateText, { color: colors.icon }]}>
              Created {new Date(ticket.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.controlsGrid}>
          <TouchableOpacity 
            style={[styles.controlCard, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '10' }]}
            onPress={() => setIsStatusModalVisible(true)}
          >
            <Text style={[styles.controlLabel, { color: colors.icon }]}>Status</Text>
            <View style={styles.controlValue}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_OPTIONS.find(s => s.value === ticket.status)?.color || colors.tint }]} />
              <Text style={[styles.valueText, { color: colors.text }]}>
                {STATUS_OPTIONS.find(s => s.value === ticket.status)?.label || ticket.status}
              </Text>
              <ChevronDown size={14} color={colors.icon} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlCard, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '10' }]}
            onPress={() => setIsPriorityModalVisible(true)}
          >
            <Text style={[styles.controlLabel, { color: colors.icon }]}>Priority</Text>
            <View style={styles.controlValue}>
              <View style={[styles.statusDot, { backgroundColor: PRIORITY_OPTIONS.find(p => p.value === ticket.priority)?.color || colors.tint }]} />
              <Text style={[styles.valueText, { color: colors.text }]}>
                {PRIORITY_OPTIONS.find(p => p.value === ticket.priority)?.label || ticket.priority}
              </Text>
              <ChevronDown size={14} color={colors.icon} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '10' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {ticket.description || 'No description provided.'}
          </Text>
        </View>

        <View style={styles.peopleSection}>
           <TouchableOpacity 
             style={styles.personItem}
             onPress={() => setIsAssigneeModalVisible(true)}
           >
              <Text style={[styles.personLabel, { color: colors.icon }]}>Assignee</Text>
              <View style={styles.personInfo}>
                {assigneeAvatar ? (
                  <Image source={{ uri: assigneeAvatar }} style={styles.smallAvatar} />
                ) : (
                  <View style={[styles.smallAvatarPlaceholder, { backgroundColor: colors.tint + '15' }]}>
                    <User size={14} color={colors.tint} />
                  </View>
                )}
                <Text style={[styles.personName, { color: colors.text }]}>
                  {ticket.assignee_profile?.full_name || 'Unassigned'}
                </Text>
                <ChevronDown size={14} color={colors.icon} style={{ marginLeft: 'auto' }} />
              </View>
           </TouchableOpacity>

           <View style={styles.personItem}>
              <Text style={[styles.personLabel, { color: colors.icon }]}>Reporter</Text>
              <View style={styles.personInfo}>
                {reporterAvatar ? (
                  <Image source={{ uri: reporterAvatar }} style={styles.smallAvatar} />
                ) : (
                  <View style={[styles.smallAvatarPlaceholder, { backgroundColor: colors.tint + '15' }]}>
                    <User size={14} color={colors.tint} />
                  </View>
                )}
                <Text style={[styles.personName, { color: colors.text }]}>
                  {ticket.reporter_profile?.full_name || 'Anonymous'}
                </Text>
              </View>
           </View>
        </View>

        <CommentList ticketId={Array.isArray(id) ? id[0] : id as string} />
      </ScrollView>

      {/* Status Selection Modal */}
      <Modal visible={isStatusModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
             <Text style={[styles.modalTitle, { color: colors.text }]}>Change Status</Text>
             {STATUS_OPTIONS.map(opt => (
               <TouchableOpacity 
                 key={opt.value}
                 style={[styles.modalOption, { borderBottomColor: colors.tabIconDefault + '10' }]}
                 onPress={() => {
                   updateTicket({ status: opt.value });
                   setIsStatusModalVisible(false);
                 }}
               >
                 <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                 <Text style={[styles.optionText, { color: colors.text }]}>{opt.label}</Text>
                 {ticket.status === opt.value && <Check size={18} color={colors.tint} />}
               </TouchableOpacity>
             ))}
             <TouchableOpacity style={styles.cancelButton} onPress={() => setIsStatusModalVisible(false)}>
               <Text style={[styles.cancelText, { color: colors.icon }]}>Cancel</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Priority Selection Modal */}
      <Modal visible={isPriorityModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
             <Text style={[styles.modalTitle, { color: colors.text }]}>Change Priority</Text>
             {PRIORITY_OPTIONS.map(opt => (
               <TouchableOpacity 
                 key={opt.value}
                 style={[styles.modalOption, { borderBottomColor: colors.tabIconDefault + '10' }]}
                 onPress={() => {
                   updateTicket({ priority: opt.value });
                   setIsPriorityModalVisible(false);
                 }}
               >
                 <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                 <Text style={[styles.optionText, { color: colors.text }]}>{opt.label}</Text>
                 {ticket.priority === opt.value && <Check size={18} color={colors.tint} />}
               </TouchableOpacity>
             ))}
             <TouchableOpacity style={styles.cancelButton} onPress={() => setIsPriorityModalVisible(false)}>
               <Text style={[styles.cancelText, { color: colors.icon }]}>Cancel</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assignee Selection Modal */}
      <Modal visible={isAssigneeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
             <Text style={[styles.modalTitle, { color: colors.text }]}>Assign To</Text>
             {teamMembers.map(member => (
               <TouchableOpacity 
                 key={member.id}
                 style={[styles.modalOption, { borderBottomColor: colors.tabIconDefault + '10' }]}
                 onPress={() => {
                   updateTicket({ assignee_id: member.id });
                   // Optimistically update the UI profile
                   setTicket((prev: any) => ({
                     ...prev,
                     assignee_id: member.id,
                     assignee_profile: {
                       full_name: member.full_name,
                       avatar_url: member.avatar_url,
                       email: member.email
                     }
                   }));
                   setIsAssigneeModalVisible(false);
                 }}
               >
                 {member.avatar_url ? (
                   <Image source={{ uri: getCleanAvatarUrl(member.avatar_url) }} style={styles.smallAvatar} />
                 ) : (
                   <View style={[styles.smallAvatarPlaceholder, { backgroundColor: colors.tint + '15' }]}>
                     <User size={14} color={colors.tint} />
                   </View>
                 )}
                 <Text style={[styles.optionText, { color: colors.text }]}>{member.full_name}</Text>
                 {ticket.assignee_id === member.id && <Check size={18} color={colors.tint} />}
               </TouchableOpacity>
             ))}
             <TouchableOpacity 
               style={[styles.modalOption, { borderBottomColor: colors.tabIconDefault + '10' }]}
               onPress={() => {
                 updateTicket({ assignee_id: null });
                 setTicket((prev: any) => ({
                   ...prev,
                   assignee_id: null,
                   assignee_profile: null
                 }));
                 setIsAssigneeModalVisible(false);
               }}
             >
               <View style={[styles.smallAvatarPlaceholder, { backgroundColor: colors.tabIconDefault + '15' }]}>
                 <User size={14} color={colors.icon} />
               </View>
               <Text style={[styles.optionText, { color: colors.text }]}>Unassigned</Text>
               {!ticket.assignee_id && <Check size={18} color={colors.tint} />}
             </TouchableOpacity>
             <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAssigneeModalVisible(false)}>
               <Text style={[styles.cancelText, { color: colors.icon }]}>Cancel</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Team Selection Modal */}
      <Modal visible={isTeamModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
             <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Team</Text>
             {userTeams.length > 0 ? (
               userTeams.map(team => (
                 <TouchableOpacity 
                   key={team.id}
                   style={[styles.modalOption, { borderBottomColor: colors.tabIconDefault + '10' }]}
                   onPress={() => {
                     updateTicket({ team_id: team.id });
                     // Optimistically update the team name in local state if possible, or refetch
                     // Simple approach: close modal, the updateTicket call updates local 'ticket' state
                     // We also need to update the display name immediately or wait for refetch?
                     // updateTicket merges ...prev, ...updates. 'updates' only has team_id.
                     // We should probably update the teams object locally too for immediate feedback.
                     setTicket((prev: any) => ({
                        ...prev,
                        team_id: team.id,
                        teams: { ...prev.teams, name: team.name }
                     }));
                     setIsTeamModalVisible(false);
                   }}
                 >
                   <Shield size={20} color={colors.tint} />
                   <Text style={[styles.optionText, { color: colors.text }]}>{team.name}</Text>
                   {ticket.team_id === team.id && <Check size={18} color={colors.tint} />}
                 </TouchableOpacity>
               ))
             ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.icon }}>No teams found.</Text>
                </View>
             )}
             <TouchableOpacity style={styles.cancelButton} onPress={() => setIsTeamModalVisible(false)}>
               <Text style={[styles.cancelText, { color: colors.icon }]}>Cancel</Text>
             </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  controlsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  controlCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  controlValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    opacity: 0.6,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  peopleSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  personItem: {
    flex: 1,
  },
  personLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  smallAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personName: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  cancelButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
