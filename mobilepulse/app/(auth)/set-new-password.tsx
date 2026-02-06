import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function SetNewPassword() {
  const params = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>Enter your new password below.</Text>
      
      <View style={styles.debugBox}>
        <Text style={styles.debugText}>Access Token: {params.accessToken?.slice(0, 10)}...</Text>
        <Text style={styles.debugText}>Refresh Token: {params.refreshToken?.slice(0, 10)}...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 30,
  },
  debugBox: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  debugText: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
});
