import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { MessageCircle, Lock } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import AIChannelConfig from './AIChannelConfig';

const INTEGRATIONS = [
  {
    id: 'discord',
    name: 'Discord Bot',
    description: 'Connect your Discord server',
    icon: MessageCircle,
    color: '#5865F2',
    proOnly: false,
    action: 'oauth',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Sync tickets with Jira',
    icon: Lock,
    color: '#0052CC',
    proOnly: true,
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Sync boards with Trello',
    icon: Lock,
    color: '#0079BF',
    proOnly: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link issues to GitHub',
    icon: Lock,
    color: '#181717',
    proOnly: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications in Slack',
    icon: Lock,
    color: '#4A154B',
    proOnly: true,
  },
];

export default function IntegrationsSection() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { profile } = useAuth();

  const isPro = ['Pro', 'Enterprise', 'super_admin'].includes(profile?.subscription_tier || '');

  const handleIntegrationPress = async (integration: typeof INTEGRATIONS[0]) => {
    if (integration.proOnly && !isPro) {
      Alert.alert('Pro Feature', 'This integration requires a Pro or Enterprise subscription.');
      return;
    }

    if (integration.id === 'discord' && integration.action === 'oauth') {
      // Discord Bot OAuth - opens in in-app browser
      const clientId = '1464385808914976923';
      const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
      
      try {
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          controlsColor: '#5865F2',
        });
      } catch {
        Alert.alert('Error', 'Unable to open Discord authorization');
      }
    }
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderTopColor: colors.tabIconDefault + '20', borderBottomColor: colors.tabIconDefault + '20' }]}>
      <Text style={[styles.sectionTitle, { color: colors.icon }]}>INTEGRATIONS</Text>
      
      <AIChannelConfig />

      {INTEGRATIONS.map((integration) => {
        const Icon = integration.icon;
        const isLocked = integration.proOnly && !isPro;

        return (
          <TouchableOpacity
            key={integration.id}
            style={[styles.integrationRow, { borderBottomColor: colors.tabIconDefault + '10' }]}
            onPress={() => handleIntegrationPress(integration)}
            disabled={isLocked}
          >
            <View style={[styles.iconContainer, { backgroundColor: integration.color + '20' }]}>
              <Icon size={20} color={integration.color} />
            </View>
            
            <View style={styles.integrationInfo}>
              <Text style={[styles.integrationName, { color: isLocked ? colors.icon : colors.text }]}>
                {integration.name}
              </Text>
              <Text style={[styles.integrationDescription, { color: colors.icon }]}>
                {integration.description}
              </Text>
            </View>

            {isLocked && (
              <View style={[styles.proBadge, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b40' }]}>
                <Text style={[styles.proText, { color: '#f59e0b' }]}>PRO</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  integrationDescription: {
    fontSize: 13,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  proText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
