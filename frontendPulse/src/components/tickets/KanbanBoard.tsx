import type { Ticket } from '../../types/ticket';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  tickets: Ticket[];
  onEdit: (ticket: Ticket) => void;
  loading: boolean;
}

const KanbanBoard = ({ tickets, onEdit, loading }: KanbanBoardProps) => {
  // Define columns order
  const columns = [
    { id: 'open', title: 'Open' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' }
  ];

  // Group tickets by status
  const groupedTickets = {
      open: tickets.filter(t => t.status === 'open'),
      in_progress: tickets.filter(t => t.status === 'in_progress'),
      review: tickets.filter(t => t.status === 'review'),
      done: tickets.filter(t => t.status === 'done')
  };

  if (loading) {
     return (
        <div className="flex gap-4 h-96 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-1 bg-slate-100 dark:bg-slate-800/30 rounded-xl" />
            ))}
        </div>
     );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-250px)] md:h-full gap-4">
      <div className="flex h-full gap-4 overflow-x-auto pb-24">
          {columns.map(col => (
              <div key={col.id} className="h-full min-w-[300px]"> 
                <KanbanColumn 
                    status={col.id} 
                    title={col.title}
                    tickets={groupedTickets[col.id as keyof typeof groupedTickets] || []}
                    onEdit={onEdit}
                />
              </div>
          ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
