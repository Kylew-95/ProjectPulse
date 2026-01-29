import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TicketPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

const TicketPagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange
}: TicketPaginationProps) => {
  return (
    <div className="p-4 bg-surface dark:bg-white/5 border-t border-border-main flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-text-secondary">
      <div className="flex items-center gap-4 order-2 sm:order-1">
        <div className="flex items-center gap-1.5 list-none">
          <button 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1 px-2 hover:bg-surface dark:hover:bg-white/5 rounded transition-colors disabled:opacity-30 flex items-center gap-1"
          >
            <ChevronLeft size={14} aria-hidden="true" /> Previous
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                currentPage === i + 1 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'hover:bg-surface dark:hover:bg-white/5'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1 px-2 hover:bg-surface dark:hover:bg-white/5 rounded transition-colors disabled:opacity-30 flex items-center gap-1"
          >
            Next <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 order-1 sm:order-2 text-text-secondary opacity-80">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>Showing <b>{Math.min(totalCount, (currentPage - 1) * pageSize + 1)}-{Math.min(totalCount, currentPage * pageSize)}</b> of <b>{totalCount}</b> tickets</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Page <b>{currentPage}</b> of <b>{totalPages}</b></span>
        </div>
      </div>
    </div>
  );
};

export default TicketPagination;
