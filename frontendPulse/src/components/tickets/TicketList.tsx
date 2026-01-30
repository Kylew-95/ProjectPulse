import { Bug, Sparkles, CheckCircle2, CircleDot } from 'lucide-react';
import type { Ticket } from '../../types/ticket';
import { useAuth } from '../../context/AuthContext';
import ResourceCard from '../common/ResourceCard';

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string | number) => void;
}

const TicketList = ({ 
  tickets, 
  loading, 
  totalCount, 
  currentPage, 
  pageSize, 
  onEdit, 
  onDelete 
}: TicketListProps) => {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
      {loading ? (
        <div className="col-span-full py-24 text-center text-text-secondary animate-pulse flex flex-col items-center gap-3">
           <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
           <span className="font-medium">Loading items...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="col-span-full py-24 text-center text-text-secondary">
          <p className="text-lg font-medium">No tickets found</p>
          <p className="text-sm opacity-70">Adjust your filters to see more results</p>
        </div>
      ) : (
        tickets.map((ticket, index) => (
          <ResourceCard
            key={ticket.id}
            title={ticket.title}
            subtitle={`TICK-${totalCount - (index + (currentPage - 1) * pageSize)}`}
            icon={Bug}
            decorationIcon={Bug}
            onClick={() => onEdit(ticket)}
            onEdit={() => onEdit(ticket)}
            onDelete={() => onDelete(ticket.id)}
            testId={`ticket-card-${ticket.id}`}
          >
            <div className="flex flex-col gap-3">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-background dark:bg-slate-900 rounded-md border border-border-main">
                    <Sparkles size={12} aria-hidden="true" className="text-amber-400" />
                    <span className="text-xs font-bold text-text-secondary dark:text-slate-300">Urgency: {ticket.urgency_score || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-background dark:bg-slate-900 rounded-md border border-border-main">
                    {ticket.status === 'done' ? <CheckCircle2 size={12} aria-hidden="true" className="text-emerald-400" /> : <CircleDot size={12} aria-hidden="true" className="text-blue-400" />}
                    <span className="text-xs font-bold uppercase text-text-secondary dark:text-slate-400">{ticket.status.replace('_', ' ')}</span>
                  </div>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md bg-background dark:bg-slate-900 border border-border-main ${
                    ticket.priority === 'critical' ? 'text-red-400' : 'text-text-secondary'
                  }`}>{ticket.priority}</span>
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t border-border-main dark:border-gray-700/50">
                  <span className="text-xs text-text-secondary dark:text-slate-400">Assignee:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-background dark:bg-slate-800 border border-border-main flex items-center justify-center text-[10px] overflow-hidden">
                        {(ticket.assignee_id === user?.id ? user?.user_metadata?.avatar_url : ticket.assignee_profile?.avatar_url) ? (
                        <img 
                          src={(ticket.assignee_id === user?.id ? user?.user_metadata?.avatar_url : ticket.assignee_profile?.avatar_url)} 
                          alt={`${ticket.assignee_profile?.full_name}'s avatar`} 
                          className="w-full h-full object-cover" 
                        />
                        ) : (
                        ticket.assignee_profile?.full_name?.[0] || '?'
                        )}
                    </div>
                    <span className="text-xs font-medium text-text-primary dark:text-slate-200">{ticket.assignee_profile?.full_name || 'Unassigned'}</span>
                  </div>
                </div>
            </div>
          </ResourceCard>
        ))
      )}
    </div>
  );
};

export default TicketList;
