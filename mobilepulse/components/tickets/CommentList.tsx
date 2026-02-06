import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MessageSquare, Send, Trash2, Edit2, X, Check } from 'lucide-react-native';
import { Image } from 'expo-image';
import { getCleanAvatarUrl } from '@/utils/image';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

interface CommentSectionProps {
  ticketId: string | number;
}

export default function CommentList({ ticketId }: CommentSectionProps) {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchComments = useCallback(async () => {
    // Don't fetch if user isn't authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', userIds);

        if (profileError) throw profileError;

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const formattedComments = data.map(c => ({
          ...c,
          profile: profileMap.get(c.user_id) || { full_name: 'Unknown User', avatar_url: '', email: '' }
        }));

        setComments(formattedComments);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketId, user]);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments:ticket_id=eq.${ticketId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `ticket_id=eq.${ticketId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;
      setNewComment('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('comments').delete().eq('id', id);
            if (error) throw error;
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  };

  const handleUpdateComment = async () => {
    if (!editContent.trim() || !editingCommentId) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editContent.trim() })
        .eq('id', editingCommentId);

      if (error) throw error;
      setEditingCommentId(null);
      setEditContent('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isOwner = user?.id === item.user_id;
    const isEditing = editingCommentId === item.id;
    const cleanUrl = getCleanAvatarUrl(item.profile?.avatar_url);

    return (
      <View style={[styles.commentCard, { borderBottomColor: colors.tabIconDefault + '10' }]}>
        <View style={styles.commentHeader}>
          {cleanUrl ? (
            <Image source={{ uri: cleanUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint + '20' }]}>
              <Text style={{ color: colors.tint, fontWeight: 'bold' }}>
                {item.profile?.full_name?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <View style={styles.commentInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.profile?.full_name || 'System User'}
            </Text>
            <Text style={[styles.date, { color: colors.icon }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          {isOwner && !isEditing && (
            <View style={styles.commentActions}>
              <TouchableOpacity onPress={() => {
                setEditingCommentId(item.id);
                setEditContent(item.content);
              }}>
                <Edit2 size={16} color={colors.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={{ marginLeft: 12 }}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editSection}>
            <TextInput
              style={[styles.editInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.tint }]}
              value={editContent}
              onChangeText={setEditContent}
              multiline
            />
            <View style={styles.editButtons}>
              <TouchableOpacity onPress={() => setEditingCommentId(null)}>
                <X size={20} color={colors.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateComment} style={{ marginLeft: 16 }}>
                <Check size={20} color={colors.tint} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <MessageSquare size={18} color={colors.icon} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Comments ({comments.length})
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.tint} style={{ padding: 20 }} />
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.icon }]}>No comments yet.</Text>
          }
        />
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '20' }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Write a comment..."
          placeholderTextColor={colors.icon + '80'}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: colors.tint }, (!newComment.trim() || submitting) && { opacity: 0.5 }]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || submitting}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  commentCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 44,
  },
  editSection: {
    marginLeft: 44,
  },
  editInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    fontSize: 14,
    minHeight: 60,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
