import { useEffect, useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import type { Comment } from '../../types/comment';
import CommentItem from './CommentItem';
import AddComment from './AddComment';

interface CommentListProps {
  ticketId: number;
}

const CommentList = ({ ticketId }: CommentListProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:user_id (
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchComments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments:ticket_id=eq.${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, fetchComments]);

  if (loading) {
    return (
      <div className="p-4 text-center text-muted">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-main font-medium">
        <MessageSquare size={18} />
        <span>Comments ({comments.length})</span>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDeleted={fetchComments}
              onUpdated={fetchComments}
            />
          ))}
        </div>
      )}

      <AddComment ticketId={ticketId} onCommentAdded={fetchComments} />
    </div>
  );
};

export default CommentList;
