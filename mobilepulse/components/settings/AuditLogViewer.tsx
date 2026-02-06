import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Search, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
}

export default function AuditLogViewer() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = logs.filter(
      (log) =>
        log.actor.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.entity_type.toLowerCase().includes(query)
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.tabIconDefault + '20', borderBottomColor: colors.tabIconDefault + '20' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.icon }]}>AUDIT LOGS</Text>
        <TouchableOpacity onPress={fetchLogs} disabled={loading}>
          <RefreshCw size={18} color={loading ? colors.icon + '40' : colors.tint} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.tabIconDefault + '20' }]}>
        <Search size={18} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search logs..."
          placeholderTextColor={colors.icon + '60'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : filteredLogs.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.icon }]}>No audit logs found</Text>
      ) : (
        <View style={styles.listContent}>
          {filteredLogs.map((item) => (
            <View key={item.id} style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '20' }]}>
              <View style={styles.logHeader}>
                <Text style={[styles.timestamp, { color: colors.icon }]}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.logBody}>
                <Text style={[styles.actor, { color: colors.text }]}>{item.actor}</Text>
                <Text style={[styles.action, { color: colors.tint }]}>{item.action}</Text>
                <Text style={[styles.entity, { color: colors.icon }]}>
                  {item.entity_type} #{item.entity_id}
                </Text>
              </View>

              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <View style={[styles.metadata, { backgroundColor: colors.background }]}>
                  <Text style={[styles.metadataText, { color: colors.icon }]}>
                    {JSON.stringify(item.metadata, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  listContent: {
    gap: 12,
  },
  logCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logHeader: {
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  logBody: {
    gap: 4,
  },
  actor: {
    fontSize: 14,
    fontWeight: '600',
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
  },
  entity: {
    fontSize: 13,
  },
  metadata: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  metadataText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  emptyText: {
    textAlign: 'center',
    padding: 40,
    fontSize: 14,
  },
});
