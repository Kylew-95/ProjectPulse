import React from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { Card, Button, Surface, Switch } from 'react-native-paper';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { User, Bell, LifeBuoy, ChevronRight, LogOut, Moon } from 'lucide-react-native';
import { router } from 'expo-router';
import { getCleanAvatarUrl } from '@/utils/image';
import SubscriptionModal from '@/components/settings/SubscriptionModal';
import IntegrationsSection from '@/components/settings/IntegrationsSection';
// import AuditLogViewer from '@/components/settings/AuditLogViewer'; // Disabled - audit_logs table doesn't exist

export default function SettingsScreen() {
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const { toggleTheme } = useTheme();
  const colors = Colors[colorScheme];

  const [showSubscriptionModal, setShowSubscriptionModal] = React.useState(false);

  const finalAvatarUrl = getCleanAvatarUrl(profile?.avatar_url) || getCleanAvatarUrl(user?.user_metadata?.avatar_url);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: async () => {
            await supabase.auth.signOut();
        }
      }
    ]);
  };

  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Profile Card */}
      <Card style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.profileContent}>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {profile?.full_name || user?.email}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.icon }]}>
                {user?.email}
              </Text>
            </View>
            <View style={styles.avatarContainer}>
              {finalAvatarUrl ? (
                <Image
                  source={{ uri: finalAvatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint + '20' }]}>
                  <User size={24} color={colors.tint} />
                </View>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Subscription Card */}
      <Surface style={[styles.section, { backgroundColor: colors.surface }]} elevation={1}>
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>Subscription</Text>
        <Card style={[styles.subscriptionCard, { backgroundColor: colors.background }]}>
          <Card.Content>
            <Text style={[styles.subscriptionLabel, { color: colors.icon }]}>Current Plan</Text>
            <View style={styles.planRow}>
              <Text style={[
                styles.planName, 
                { color: profile?.subscription_tier?.toLowerCase() === 'super_admin' ? colors.text : colors.tint }
              ]}>
                {(profile?.subscription_tier || 'Starter').toUpperCase()}
              </Text>
              <View style={[
                styles.statusBadge, 
                { 
                  backgroundColor: profile?.subscription_tier?.toLowerCase() === 'super_admin' ? colors.text + '20' : '#10b98120',
                  borderColor: profile?.subscription_tier?.toLowerCase() === 'super_admin' ? colors.text + '40' : '#10b98140'
                }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: profile?.subscription_tier?.toLowerCase() === 'super_admin' ? colors.text : '#10b981' }
                ]}>
                  {profile?.subscription_tier?.toLowerCase() === 'super_admin' ? 'ADMIN' : 'ACTIVE'}
                </Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="outlined" 
              onPress={() => {
                console.log('Opening subscription modal');
                setShowSubscriptionModal(true);
              }}
              style={[styles.manageButton, { borderColor: '#3b82f6' }]}
              textColor="#3b82f6"
            >
              Manage Subscription
            </Button>
          </Card.Actions>
        </Card>

        <IntegrationsSection />
      </Surface>

      {/* Account Section */}
      <Surface style={[styles.section, { backgroundColor: colors.surface }]} elevation={1}>
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>Account</Text>
        <Button 
          mode="text" 
          icon={() => <User size={20} color={colors.icon} />}
          contentStyle={styles.buttonContent}
          style={styles.menuButton}
          onPress={() => router.push('/settings/profile')}
        >
          <View style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: colors.text }]}>Edit Profile</Text>
            <ChevronRight size={20} color={colors.icon + '60'} />
          </View>
        </Button>
        <View style={styles.menuRow}>
            <View style={styles.buttonRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <Moon size={20} color={colors.icon} />
                    <Text style={[styles.buttonText, { color: colors.text }]}>Dark Mode</Text>
                </View>
                <Switch 
                    value={colorScheme === 'dark'} 
                    onValueChange={toggleTheme}
                    color={colors.tint}
                />
            </View>
        </View>
      </Surface>

      {/* Support Section */}
      <Surface style={[styles.section, { backgroundColor: colors.surface }]} elevation={1}>
        <View>
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>Support</Text>
        </View>
        <Button 
          mode="text" 
          icon={() => <LifeBuoy size={20} color={colors.icon} />}
          contentStyle={styles.buttonContent}
          style={styles.menuButton}
        >
          <View style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: colors.text }]}>Help & Support</Text>
            <ChevronRight size={20} color={colors.icon + '60'} />
          </View>
        </Button>
      </Surface>

      {/* <AuditLogViewer /> - Disabled - audit_logs table doesn't exist */}

      <Button 
        mode="contained" 
        icon={() => <LogOut size={20} color="#fff" />}
        buttonColor="#ef4444"
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        Sign Out
      </Button>
      
      {/* <Text style={[styles.version, { color: colors.icon + '60' }]}>Version 1.0.0</Text> */}

    </ScrollView>
    <SubscriptionModal 
      visible={showSubscriptionModal}
      onClose={() => setShowSubscriptionModal(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  profileCard: {
    margin: 16,
    marginTop: 8,
  },
  profileContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  avatarContainer: {
    marginLeft: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  subscriptionCard: {
    marginBottom: 16,
  },
  subscriptionLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  manageButton: {
    marginTop: 8,
  },
  menuButton: {
    justifyContent: 'flex-start',
    marginVertical: 4,
  },
  buttonContent: {
    justifyContent: 'flex-start',
  },
  buttonRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
  signOutButton: {
    margin: 16,
    marginTop: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 32,
  },
  menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16, // Match button padding if possible, or adjust
  }
});
