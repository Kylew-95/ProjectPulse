import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { UserPlus, ChevronLeft, Mail, Shield, Users } from 'lucide-react-native';

import { Modal, FlatList } from 'react-native';
import { TEAM_ROLES } from '@/constants/roles';
import { Search, X } from 'lucide-react-native';

const ROLES = TEAM_ROLES.map(r => ({ label: r, value: r }));

export default function InviteMemberScreen() {
  const { teamId } = useLocalSearchParams();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [email, setEmail] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [role, setRole] = useState('Developer');
  const [loading, setLoading] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');

  const handleInvite = async () => {
    if (!email.trim() && !discordId.trim()) {
      Alert.alert('Error', 'Please enter an email or a Discord ID');
      return;
    }

    if (!user || !teamId) return;

    setLoading(true);
    try {
      // 0. Check Single Admin Constraint
      if (role.toLowerCase() === 'admin') {
        const { data: adminExists } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .ilike('role', 'admin')
          .single();

        if (adminExists) {
          throw new Error('This team already has an Admin. Only one Admin is allowed.');
        }
      }

      // 1. Check if user already exists in profiles (optional, but helpful)
      let profileData = null;
      if (email.trim()) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        profileData = data;
      }

      // 2. Insert into team_members
      // In a real app, this might trigger an email via a Supabase Edge Function
      const { error } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamId,
          user_id: profileData?.id || null, // If profile exists, link it
          email: email.trim().toLowerCase() || 'pending@discord.user',
          discord_id: discordId.trim() || null,
          role: role,
          status: 'invited'
        }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('This user is already a member or has been invited.');
        }
        throw error;
      }

      Alert.alert('Success', `Invitation sent to ${email}`);
      router.back();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Invite Teammate',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '10' }]}>
          <UserPlus size={40} color={colors.tint} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Add to Team</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Invite someone to collaborate on your projects. They will receive an invitation to join.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Discord ID / Username</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: colors.surface,
            borderColor: colors.tabIconDefault + '20'
          }]}>
            <Users size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="username#1234 or username"
              placeholderTextColor={colors.icon}
              value={discordId}
              onChangeText={setDiscordId}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Email Address (Optional)</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: colors.surface,
            borderColor: colors.tabIconDefault + '20'
          }]}>
            <Mail size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="teammate@example.com"
              placeholderTextColor={colors.icon}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Role</Text>
          <TouchableOpacity 
            style={[styles.inputWrapper, { 
              backgroundColor: colors.surface,
              borderColor: colors.tabIconDefault + '20'
            }]}
            onPress={() => setIsRoleModalVisible(true)}
          >
            <Shield size={20} color={colors.tint} style={styles.inputIcon} />
            <Text style={[styles.input, { color: colors.text, paddingTop: 14 }]}>
              {role}
            </Text>
          </TouchableOpacity>
        </View>

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
                      setRole(item.value);
                      setIsRoleModalVisible(false);
                      setRoleSearch('');
                    }}
                  >
                    <Text style={[styles.roleItemText, { color: colors.text, fontWeight: role === item.value ? 'bold' : 'normal' }]}>
                      {item.label}
                    </Text>
                    {role === item.value && <Shield size={16} color={colors.tint} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleInvite}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Send Invitation</Text>
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
  content: {
    padding: 24,
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
  },
  roleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
