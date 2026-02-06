import { useState } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import type { Comment } from '../../types/comment';

interface CommentItemProps {
  comment: Comment;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

const CommentItem = ({ comment, onDeleted, onUpdated }: CommentItemProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === comment.user_id;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', comment.id);

      if (error) throw error;

      setIsEditing(false);
      toast.success('Comment updated!');
      onUpdated?.();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;

      toast.success('Comment deleted!');
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex gap-3 p-4 bg-surface/50 rounded-lg border border-border-main">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {comment.profile?.full_name?.[0] || comment.profile?.email?.[0] || '?'}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-main">
              {comment.profile?.full_name || comment.profile?.email?.split('@')[0] || 'Unknown User'}
            </span>
            <span className="text-xs text-muted">
              {formatDate(comment.created_at)}
              {comment.updated_at !== comment.created_at && ' (edited)'}
            </span>
          </div>
          {isOwner && !isEditing && (
            <div className="flex gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-muted hover:text-main transition-colors"
                title="Edit comment"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                title="Delete comment"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-background border border-border-main rounded px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1"
              >
                <Check size={14} /> Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1 bg-surface hover:bg-surface/80 text-main rounded text-sm flex items-center gap-1"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-main whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
