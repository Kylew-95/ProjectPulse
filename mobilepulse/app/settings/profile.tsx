import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack } from 'expo-router';
import { User, Mail, ChevronLeft, Camera } from 'lucide-react-native';
import { getCleanAvatarUrl } from '@/utils/image';


export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const finalAvatarUrl = getCleanAvatarUrl(profile?.avatar_url) || getCleanAvatarUrl(user?.user_metadata?.avatar_url);
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Edit Profile',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerName, { color: colors.text }]}>{profile?.full_name || 'User'}</Text>
            <Text style={[styles.headerEmail, { color: colors.icon }]}>{user?.email}</Text>
          </View>
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
                <User size={32} color={colors.tint} />
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.surface }]}>
              <Camera size={16} color={colors.tint} />
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: colors.surface,
            borderColor: colors.tabIconDefault + '20',
            opacity: 0.6
          }]}>
            <Mail size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.icon }]}
              value={user?.email || ''}
              editable={false}
            />
          </View>
          <Text style={[styles.hint, { color: colors.icon }]}>Email cannot be changed.</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: colors.surface,
            borderColor: colors.tabIconDefault + '20'
          }]}>
            <User size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Your Name"
              placeholderTextColor={colors.icon}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleSave}
          disabled={loading || fullName === profile?.full_name}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
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
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  headerTextContainer: {
    marginLeft: 20,
    flex: 1,
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginLeft: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
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
  hint: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
