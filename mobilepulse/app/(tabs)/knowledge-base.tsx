import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Book, Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react-native';
import { Stack } from 'expo-router';

interface KBEntry {
  id: number;
  question: string;
  answer: string;
  created_at: string;
}

export default function KnowledgeBase() {
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [submitting, setSubmitting] = useState(false);

  // Access Control
  const isAuthorized = ['pro', 'enterprise', 'super_admin'].includes(profile?.subscription_tier?.toLowerCase() || '');

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      console.error('Error fetching KB:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);


  if (!isAuthorized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <PremiumGate isAuthorized={false} featureName="Knowledge Base" requiredTier="Pro">
          <></>
        </PremiumGate>
      </View>
    );
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntries();
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('knowledge_base')
          .update({ 
            question: formData.question, 
            answer: formData.answer 
          })
          .eq('id', editingEntry.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('knowledge_base')
          .insert({ 
            question: formData.question, 
            answer: formData.answer,
            user_id: user.id // Explicitly setting user_id for RLS
          });
        
        if (error) throw error;
      }

      setIsModalVisible(false);
      setEditingEntry(null);
      setFormData({ question: '', answer: '' });
      fetchEntries();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this knowledge base entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('knowledge_base')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              fetchEntries();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const openModal = (entry?: KBEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({ question: entry.question, answer: entry.answer });
    } else {
      setEditingEntry(null);
      setFormData({ question: '', answer: '' });
    }
    setIsModalVisible(true);
  };

  const filteredEntries = entries.filter(e => 
    e.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Knowledge Base',
        headerRight: () => (
          <TouchableOpacity onPress={() => openModal()}>
            <Plus size={24} color={colors.tint} />
          </TouchableOpacity>
        )
      }} />

      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Search size={20} color={colors.icon} />
        <TextInput 
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search knowledge base..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '15' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.tint + '15' }]}>
                  <Book size={20} color={colors.tint} />
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
                    <Edit2 size={16} color={colors.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                    <Trash2 size={16} color={colors.error || '#ef4444'} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
              <Text style={[styles.answer, { color: colors.icon }]}>{item.answer}</Text>
              
              <View style={[styles.divider, { backgroundColor: colors.tabIconDefault + '15' }]} />
              <Text style={[styles.meta, { color: colors.tabIconDefault }]}>
                ID: #{item.id} • {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                {searchQuery ? 'No matching entries found.' : 'No knowledge base entries yet.'}
              </Text>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.tint }]} onPress={() => openModal()}>
                <Text style={styles.createBtnText}>Add Entry</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Editor Modal */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.tabIconDefault + '15' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingEntry ? 'Edit Entry' : 'New Entry'}
            </Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={[styles.cancelText, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.icon }]}>Question / Topic</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.tabIconDefault + '20' }]}
              placeholder="e.g. How do I reset my password?"
              placeholderTextColor={colors.icon + '80'}
              value={formData.question}
              onChangeText={(text) => setFormData(prev => ({ ...prev, question: text }))}
            />

            <Text style={[styles.label, { color: colors.icon }]}>Answer</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.tabIconDefault + '20' }]}
              placeholder="Provide details..."
              placeholderTextColor={colors.icon + '80'}
              value={formData.answer}
              onChangeText={(text) => setFormData(prev => ({ ...prev, answer: text }))}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.tint }, submitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Save Entry</Text>
                </>
              )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    marginHorizontal: 10,
    marginBottom: 10,
    marginTop: 70, // Adjusted to prevent header overlap
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconBox: {
    padding: 8,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  meta: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  createBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 150,
    paddingTop: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
