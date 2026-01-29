import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  entityName?: string;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  entityName = 'items',
  className = ''
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalCount === 0) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm ${className}`}>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-tight">
         Showing <span className="text-gray-900 dark:text-gray-100 px-1 font-bold">{Math.min((currentPage-1)*pageSize + 1, totalCount)}-{Math.min(currentPage*pageSize, totalCount)}</span> of <span className="text-gray-900 dark:text-gray-100 px-1 font-bold">{totalCount}</span> {entityName}
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="group flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 disabled:opacity-50 disabled:hover:text-gray-500 transition-all border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl"
        >
          <ChevronLeft size={18} aria-hidden="true" className="group-hover:-translate-x-1 transition-transform" /> 
          Previous
        </button>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold shadow-sm">
           <span className="opacity-50 tracking-tighter uppercase text-[10px]">Page</span>
           {currentPage} <span className="opacity-30">/</span> {Math.max(1, totalPages)}
        </div>

        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="group flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 disabled:opacity-50 disabled:hover:text-gray-500 transition-all border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl"
        >
          Next
          <ChevronRight size={18} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
