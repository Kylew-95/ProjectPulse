import { StrictModeDroppable } from './StrictModeDroppable';
import type { Ticket } from '../../types/ticket';
import TicketCard from './TicketCard';

interface KanbanColumnProps {
  status: string;
  title: string;
  tickets: Ticket[];
  onEdit: (ticket: Ticket) => void;
}

const KanbanColumn = ({ status, title, tickets, onEdit }: KanbanColumnProps) => {
  // Status Colors for headers
  const getStatusColor = (s: string) => {
      switch(s) {
          case 'open': return 'bg-blue-500';
          case 'in_progress': return 'bg-yellow-500';
          case 'review': return 'bg-purple-500';
          case 'done': return 'bg-emerald-500';
          default: return 'bg-slate-500';
      }
  };

  return (
    <div className="flex flex-col min-w-[280px] w-full max-w-[350px] bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-200/60 dark:border-white/5 h-full max-h-[calc(100vh-220px)]">
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 backdrop-blur-sm sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 z-10 rounded-t-xl">
         <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
             <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm capitalize">
                {title}
             </h3>
             <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-full">
                {tickets.length}
             </span>
         </div>
      </div>

      {/* Droppable Area */}
      <StrictModeDroppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`
                flex-1 p-2 overflow-y-auto min-h-[150px] transition-colors duration-200
                ${snapshot.isDraggingOver ? 'bg-slate-100/50 dark:bg-slate-800/30' : ''}
            `}
          >
            <div className="flex flex-col gap-2">
                {tickets.map((ticket, index) => (
                    <TicketCard 
                        key={ticket.id} 
                        ticket={ticket} 
                        index={index} 
                        onEdit={onEdit}
                    />
                ))}
            </div>
            {provided.placeholder}
          </div>
        )}
      </StrictModeDroppable>
    </div>
  );
};

export default KanbanColumn;
