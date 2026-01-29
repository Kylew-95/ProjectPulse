import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  Download, 
  Search as SearchIcon,
  Bug,
  CircleDot,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  AlertCircle,
  ArrowUpRight,
  LayoutList,
  Table as TableIcon,
  Ticket as TicketIcon,
  Pencil,
  Sparkles
} from 'lucide-react';
import CreateTicketModal from '../../components/tickets/CreateTicketModal';
import EditTicketModal from '../../components/tickets/EditTicketModal';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import FilterDropdown from '../../components/ui/FilterDropdown';
import { exportToCSV } from '../../utils/exportUtils';

interface Ticket {
  id: string | number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  assignee: string | null;
  reporter?: string | null;
  assignee_id: string | null;
  team_id: string;
  urgency: number | null;
  assignee_profile?: { full_name: string; avatar_url: string };
  reporter_profile?: { full_name: string; avatar_url: string };
}

const Tickets = () => {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .limit(1)
        .single();
      
      if (data) setUserTeamId(data.team_id);
    };
    fetchUserTeam();
  }, [session]);
  const pageSize = 10;

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [allProfiles, setAllProfiles] = useState<{id: string, full_name: string}[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name');
      if (data) setAllProfiles(data);
    };
    fetchProfiles();
  }, []);

  const fetchTickets = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('tickets')
        .select(`
          *,
          assignee_profile:profiles!tickets_assignee_id_fkey(full_name, avatar_url),
          reporter_profile:profiles!tickets_reporter_id_fkey(full_name, avatar_url)
        `, { count: 'exact' });

      // Apply Filters
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }
      if (assigneeFilter !== 'all') {
        query = query.eq('assignee', assigneeFilter);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      setTickets(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [session, currentPage, statusFilter, priorityFilter, assigneeFilter]); // Re-fetch on filter change

  // Handle Search Debounce (Simpler version for now)
  useEffect(() => {
    setCurrentPage(1);
    fetchTickets();
  }, [searchQuery]);

  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'open', label: 'Open', icon: <CircleDot size={14} className="text-blue-400" /> },
    { id: 'in_progress', label: 'In Progress', icon: <Clock size={14} className="text-amber-400" /> },
    { id: 'done', label: 'Done', icon: <CheckCircle2 size={14} className="text-emerald-400" /> },
  ];

  const priorityOptions = [
    { id: 'all', label: 'All Priorities' },
    { id: 'low', label: 'Low', icon: <ArrowUpRight size={14} className="text-slate-400" /> },
    { id: 'medium', label: 'Medium', icon: <ArrowUpRight size={14} className="text-blue-400" /> },
    { id: 'high', label: 'High', icon: <AlertCircle size={14} className="text-orange-400" /> },
    { id: 'critical', label: 'Critical', icon: <AlertCircle size={14} className="text-red-400" /> },
  ];

  const assigneeOptions = [
    { id: 'all', label: 'All Assignees' },
    ...allProfiles.map(p => ({ id: p.id, label: p.full_name }))
  ];

  const handleExport = () => {
    const exportData = tickets.map(t => ({
      Key: `TICK-${totalCount - (tickets.indexOf(t) + (currentPage-1)*pageSize)}`,
      Title: t.title,
      Status: t.status,
      Priority: t.priority,
      Urgency: t.urgency || 0,
      Assignee: t.assignee_profile?.full_name || 'Unassigned',
      Reporter: t.reporter_profile?.full_name || 'System',
      Created: new Date(t.created_at).toLocaleDateString()
    }));
    exportToCSV(exportData, `tickets-export-${new Date().toISOString().split('T')[0]}`);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      fetchTickets(); // Refresh both data and count
    } catch (err: any) {
      console.error('Error deleting ticket:', err);
      alert(`Error deleting ticket: ${err.message || 'Unknown error'}`);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen font-sans selection:bg-primary/30">
      <Breadcrumbs />

      {/* Header Section */}
      <div className="flex justify-between items-end mb-8 px-2">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Tickets</h1>
        </div>
        <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-all text-sm font-medium border border-white/5"
            >
                <Download size={14} /> 
                <span className="hidden md:inline">Export tickets</span>
                <ChevronDown size={14} />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-all text-sm font-medium border border-white/5">
                Go to advanced search
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg transition-all text-sm font-medium border border-white/5 md:hidden">
              <Plus size={16} />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-all font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={3} /> Create
            </button>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        {/* Stylized Filter Bar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3 bg-white/5">
          <div className="relative group flex-1 max-w-xs min-w-[200px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />
          </div>

          <FilterDropdown 
            label="Assignee" 
            options={assigneeOptions} 
            selectedId={assigneeFilter} 
            onSelect={setAssigneeFilter} 
            icon={<Users size={14} />}
          />
          
          <FilterDropdown 
            label="Status" 
            options={statusOptions} 
            selectedId={statusFilter} 
            onSelect={setStatusFilter} 
          />

          <FilterDropdown 
            label="Priority" 
            options={priorityOptions} 
            selectedId={priorityFilter} 
            onSelect={setPriorityFilter}
          />
          
          <div className="h-6 w-px bg-white/10 mx-1 hidden lg:block"></div>

          <button className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors text-sm font-medium">
            Reporter <ChevronDown size={14} className="opacity-50" />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors text-sm font-medium">
            Type <ChevronDown size={14} className="opacity-50" />
          </button>
          
          <div className="h-6 w-px bg-white/10 mx-1 hidden lg:block"></div>

          <div className="flex items-center bg-slate-950/50 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <TableIcon size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutList size={16} />
            </button>
          </div>

          <button className="ml-auto hidden lg:flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
            Switch to detail view <ExternalLink size={14} className="opacity-50" />
          </button>
        </div>

        {/* Dynamic Table or List View */}
        <div className="overflow-x-auto">
          {viewMode === 'table' ? (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-white/5">
                  <th className="px-6 py-4 w-12 text-center">Type</th>
                  <th className="px-6 py-4 w-24">Key</th>
                  <th className="px-6 py-4">Summary</th>
                  <th className="px-6 py-4 w-24 text-center cursor-pointer hover:text-white transition-colors group/urgency" onClick={() => {
                      setTickets([...tickets].sort((a,b) => (b.urgency || 0) - (a.urgency || 0)));
                  }}>
                    <div className="flex items-center justify-center gap-1">
                      Urgency
                      <ChevronDown size={12} className="opacity-0 group-hover/urgency:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th className="px-6 py-4 w-32">Assignee</th>
                  <th className="px-6 py-4 w-32">Reporter</th>
                  <th className="px-6 py-4 w-32">Status</th>
                  <th className="px-6 py-4 w-32">Priority</th>
                  <th className="px-6 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <span className="text-slate-500 text-sm font-medium">Loading items...</span>
                        </div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-24 text-center">
                        <div className="max-w-xs mx-auto text-slate-500">
                            <TicketIcon className="mx-auto mb-4 opacity-10" size={48} />
                            <p className="font-bold text-slate-400 mb-1">No work items found</p>
                            <p className="text-xs">Try adjusting your filters or create a new ticket to get started.</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket, index) => {
                    const absIndex = totalCount - (index + (currentPage-1)*pageSize);
                    return (
                      <tr key={ticket.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <td className="px-6 py-4 text-center">
                          <Bug size={16} className="text-red-400 opacity-80" />
                        </td>
                        <td className="px-6 py-4 text-[13px] font-bold text-slate-500">TICK-{absIndex}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-200 group-hover:text-primary transition-colors line-clamp-1">{ticket.title}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold border ${
                            (ticket.urgency || 0) > 80 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            (ticket.urgency || 0) > 50 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/10'
                          }`}>
                            {ticket.urgency || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden uppercase">
                                {ticket.assignee_profile?.avatar_url ? (
                                    <img src={ticket.assignee_profile.avatar_url} alt="A" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{ticket.assignee_profile?.full_name?.[0] || '?'}</span>
                                )}
                             </div>
                             <span className="text-xs text-slate-400 truncate max-w-[80px]">
                                {ticket.assignee_profile?.full_name || 'Unassigned'}
                             </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 p-0.5">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.id}`} alt="Reporter" className="w-full h-full rounded-full" />
                           </div>
                            <span className="text-xs text-slate-400 truncate max-w-[80px]">
                                {ticket.reporter_profile?.full_name || 'System'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {ticket.status === 'done' ? <CheckCircle2 size={14} className="text-emerald-400" /> : 
                             ticket.status === 'in_progress' ? <Clock size={14} className="text-amber-400" /> : 
                             <CircleDot size={14} className="text-blue-400" />}
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{ticket.status.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            ticket.priority === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            ticket.priority === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                            ticket.priority === 'medium' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-slate-500/10 text-slate-500 border-slate-500/20'
                          }`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); setIsEditModalOpen(true); }}
                              className="text-slate-600 hover:text-primary transition-colors p-2"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id); }}
                              className="text-slate-600 hover:text-red-500 transition-colors p-2"
                            >
                                <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* List View Rendering */
            <div className="p-4 space-y-3 min-w-[600px]">
               {loading ? (
                  <div className="py-24 text-center text-slate-500 animate-pulse">Loading list view...</div>
               ) : tickets.length === 0 ? (
                  <div className="py-24 text-center text-slate-500">No items to display.</div>
               ) : (
                 tickets.map((ticket, index) => (
                   <div key={ticket.id} onClick={() => { setSelectedTicket(ticket); setIsEditModalOpen(true); }} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group relative">
                      <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                            <Bug size={16} className="text-red-400 opacity-60" />
                            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-primary transition-colors">{ticket.title}</h3>
                         </div>
                         <span className="text-[10px] font-bold text-slate-600">TICK-{totalCount - (index + (currentPage-1)*pageSize)}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-md border border-white/5">
                               <Sparkles size={12} className="text-amber-400" />
                               <span className="text-[10px] font-bold text-slate-300">Urgency: {ticket.urgency || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-md border border-white/5">
                               {ticket.status === 'done' ? <CheckCircle2 size={12} className="text-emerald-400" /> : <CircleDot size={12} className="text-blue-400" />}
                               <span className="text-[10px] font-bold uppercase text-slate-400">{ticket.status}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase ${
                              ticket.priority === 'critical' ? 'text-red-400' : 'text-slate-500'
                            }`}>{ticket.priority} priority</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">Assignee: {ticket.assignee_profile?.full_name || 'None'}</span>
                            <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[8px] overflow-hidden">
                               {ticket.assignee_profile?.avatar_url ? (
                                 <img src={ticket.assignee_profile.avatar_url} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 ticket.assignee_profile?.full_name?.[0] || '?'
                               )}
                            </div>
                         </div>
                      </div>
                      
                      {/* Hover Delete Action */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id); }}
                        className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-500 hover:text-red-500 bg-slate-950/50 rounded-lg"
                      >
                         <Trash2 size={14} />
                      </button>
                   </div>
                 ))
               )}
            </div>
          )}
        </div>

        {/* Real Pagination Footer */}
        <div className="p-4 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 grayscale opacity-50 cursor-pointer hover:opacity-100 transition-opacity">
                 <MoreHorizontal size={14} /> <span>Give feedback</span>
             </div>
             <span>Showing {Math.min((currentPage-1)*pageSize + 1, totalCount)}-{Math.min(currentPage*pageSize, totalCount)} of {totalCount}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              // Logic to show only a subset of page numbers with ellipsis
              const pageNum = i + 1;
              const isCurrent = pageNum === currentPage;
              const isFirst = pageNum === 1;
              const isLast = pageNum === totalPages;
              const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;
              const showEllipsisBefore = pageNum === 2 && currentPage > 3;
              const showEllipsisAfter = pageNum === totalPages - 1 && currentPage < totalPages - 2;

              if (totalPages <= 7 || isFirst || isLast || isNearCurrent || showEllipsisBefore || showEllipsisAfter) {
                if ((showEllipsisBefore && !isFirst && !isNearCurrent) || (showEllipsisAfter && !isLast && !isNearCurrent)) {
                  return <span key={`ellipsis-${i}`} className="px-2 py-1">...</span>;
                }
                return (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                      isCurrent 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              }
              return null;
            })}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsModalOpen(false)} 
          onTicketCreated={fetchTickets}
          teamId={userTeamId}
        />
      )}

      {isEditModalOpen && selectedTicket && (
        <EditTicketModal 
          ticket={selectedTicket}
          onClose={() => { setIsEditModalOpen(false); setSelectedTicket(null); }} 
          onTicketUpdated={fetchTickets}
        />
      )}
    </div>
  );
};
export default Tickets;
