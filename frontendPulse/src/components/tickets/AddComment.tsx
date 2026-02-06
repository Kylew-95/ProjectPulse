import { useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface AddCommentProps {
  ticketId: number;
  onCommentAdded?: () => void;
}

const AddComment = ({ ticketId, onCommentAdded }: AddCommentProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;

      setContent('');
      toast.success('Comment added!');
      onCommentAdded?.();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="flex-1 bg-surface border border-border-main rounded-lg px-4 py-2 text-main focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted">
          {content.length} characters
        </span>
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send size={16} />
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};

export default AddComment;
