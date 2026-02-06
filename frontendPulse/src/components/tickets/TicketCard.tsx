import { Draggable } from '@hello-pangea/dnd';
import type { Ticket } from '../../types/ticket';
import { useAuth } from '../../context/AuthContext';
import PriorityBadge from '../common/PriorityBadge';
import { TagBadge } from '../common/TagComponents';

interface TicketCardProps {
  ticket: Ticket;
  index: number;
  onEdit: (ticket: Ticket) => void;
}

const TicketCard = ({ ticket, index, onEdit }: TicketCardProps) => {
  const { user } = useAuth();

  // Avatar logic
  const isCurrentUser = ticket.assignee_id === user?.id;
  const avatarUrl = (isCurrentUser ? user?.user_metadata?.avatar_url : null) || ticket.assignee_profile?.avatar_url;
  const assigneeName = ticket.assignee_profile?.full_name || 'Unassigned';

  return (
    <Draggable draggableId={ticket.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(ticket)}
          style={{
            ...provided.draggableProps.style,
          }}
          className={`
            bg-white dark:bg-[#0f172a] p-3 rounded-lg border shadow-sm cursor-pointer
            group hover:border-primary/50
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary rotate-2 z-50' : 'border-slate-200 dark:border-slate-800'}
          `}
        >
          {/* Header: ID + Priority */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-slate-400">#{ticket.id}</span>
            <PriorityBadge priority={ticket.priority} size="sm" />
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 line-clamp-2">
            {ticket.title}
          </h4>

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {ticket.tags.slice(0, 3).map(tag => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {ticket.tags.length > 3 && (
                <span className="text-[10px] text-slate-400 px-1.5 py-0.5">
                  +{ticket.tags.length - 3}
                </span>
              )}
            </div>
          )}


          {/* Footer: Team + Assignee */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/50">
             {/* Team Name */}
             <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">
                {ticket.team?.name || ticket.teams?.name || 'No Team'}
             </span>

             {/* Assignee Avatar */}
             <div className="flex items-center gap-1.5" title={assigneeName}>
                 <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                         <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                         <span className="text-[8px] font-bold text-slate-500">
                             {assigneeName !== 'Unassigned' ? assigneeName[0] : '?'}
                         </span>
                    )}
                 </div>
             </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TicketCard;
