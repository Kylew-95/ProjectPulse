import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Lock } from 'lucide-react-native';

interface PremiumGateProps {
  children: React.ReactNode;
  isAuthorized: boolean;
  featureName: string;
  requiredTier?: string;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  children, 
  isAuthorized, 
  featureName,
  requiredTier = 'Pro'
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
          <Lock size={48} color={colors.tint} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          {featureName} Restricted
        </Text>
        
        <Text style={[styles.description, { color: colors.icon }]}>
          Your plan does not include access to {featureName}. Upgrade to {requiredTier} or Enterprise to unlock this feature.
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.buttonText}>View Plans</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    opacity: 0.8,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
