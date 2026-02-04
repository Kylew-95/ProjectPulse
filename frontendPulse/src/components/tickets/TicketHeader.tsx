import { Plus, Clock, Download } from 'lucide-react';
import PageHeader from '../common/PageHeader';

interface TicketHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onCreateOpen: () => void;
}

const TicketHeader = ({ loading, onRefresh, onExport, onCreateOpen }: TicketHeaderProps) => {
  return (
    <PageHeader title="Tickets">
      <button 
        onClick={onRefresh}
        className="p-2.5 bg-surface hover:bg-background/50 text-muted rounded-lg transition-all border border-border-main active:scale-95 group shadow-sm"
        aria-label="Refresh tickets"
      >
        <Clock size={16} aria-hidden="true" className={`${loading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />
      </button>
      <button 
        onClick={onExport}
        className="flex items-center gap-2 px-3 py-2.5 bg-surface hover:bg-background/50 text-muted rounded-lg transition-all text-sm font-medium border border-border-main shadow-sm"
        aria-label="Export tickets to CSV"
      >
        <Download size={16} aria-hidden="true" />
        <span className="hidden md:inline">Export CSV</span>
      </button>
      <button 
        onClick={onCreateOpen}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        aria-label="Create new ticket"
      >
        <Plus size={18} aria-hidden="true" /> 
        <span className="hidden sm:inline">Create Ticket</span>
        <span className="sm:hidden">Create</span>
      </button>
    </PageHeader>
  );
};

export default TicketHeader;
