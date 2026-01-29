import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

import CreateTicketModal from '../../components/tickets/CreateTicketModal';
import EditTicketModal from '../../components/tickets/EditTicketModal';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import TicketHeader from '../../components/tickets/TicketHeader';
import TicketFilters from '../../components/tickets/TicketFilters';
import TicketTable from '../../components/tickets/TicketTable';
import TicketList from '../../components/tickets/TicketList';
import Pagination from '../../components/common/Pagination';
import { exportToCSV } from '../../utils/exportUtils';

import type { Ticket } from '../../types/ticket';

const Tickets = () => {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTeams, setUserTeams] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [sortByUrgency, setSortByUrgency] = useState(false);
  const pageSize = 10;

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!session?.user?.id) return;
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id, teams(id, name)')
        .eq('user_id', session.user.id);
      
      if (error) {
        console.error('Error fetching user teams:', error);
        return;
      }

      const teams = data?.map(m => {
        const t = Array.isArray(m.teams) ? m.teams[0] : m.teams;
        return { id: t.id, name: t.name };
      }) || [];

      setUserTeams(teams);
    };
    fetchUserTeams();
  }, [session]);

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
          reporter_profile:profiles!tickets_reporter_id_fkey(full_name, avatar_url),
          teams(name)
        `, { count: 'exact' });

      if (selectedTeamId !== 'all') query = query.eq('team_id', selectedTeamId);
      if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter);

      // Implement Sorting
      if (sortByUrgency) {
        query = query.order('urgency_score', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query.range(from, to);
      
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
  }, [session, currentPage, statusFilter, priorityFilter, selectedTeamId, refreshTrigger, sortByUrgency]);

  useEffect(() => {
    setCurrentPage(1);
    fetchTickets();
  }, [searchQuery]);

  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
  ];

  const priorityOptions = [
    { id: 'all', label: 'All Priorities' },
    { id: 'low', label: 'Low' },
    { id: 'medium', label: 'Medium' },
    { id: 'high', label: 'High' },
    { id: 'critical', label: 'Critical' },
  ];

  const teamOptions = [
    { value: 'all', label: 'All Teams' },
    ...userTeams.map(t => ({ value: t.id, label: t.name }))
  ];

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      refreshData();
    } catch (err: any) {
      console.error('Error deleting ticket:', err);
    }
  };

  const handleExport = () => {
    const data = tickets.map(t => ({
      ID: t.id,
      Title: t.title,
      Status: t.status,
      Priority: t.priority,
      Assignee: t.assignee_profile?.full_name || 'Unassigned',
      Urgency: t.urgency_score || 0,
      Created: new Date(t.created_at).toLocaleDateString()
    }));
    exportToCSV(data, 'project-pulse-tickets');
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen animate-in fade-in duration-700">
      <Breadcrumbs />

      <TicketHeader 
        loading={loading}
        onRefresh={refreshData}
        onExport={handleExport}
        onCreateOpen={() => setIsModalOpen(true)}
      />

      <div className="space-y-6">
        <TicketFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          teamOptions={teamOptions}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusOptions={statusOptions}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          priorityOptions={priorityOptions}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {viewMode === 'table' ? (
          <TicketTable 
            tickets={tickets}
            loading={loading}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onEdit={(t) => { setSelectedTicket(t); setIsEditModalOpen(true); }}
            onDelete={handleDelete}
            onSortByUrgency={() => setSortByUrgency(!sortByUrgency)}
          />
        ) : (
          <TicketList 
            tickets={tickets}
            loading={loading}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onEdit={(t) => { setSelectedTicket(t); setIsEditModalOpen(true); }}
            onDelete={handleDelete}
          />
        )}

        <Pagination 
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          entityName="tickets"
        />
      </div>

      {isModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsModalOpen(false)} 
          onTicketCreated={fetchTickets}
          teamId={selectedTeamId === 'all' ? (userTeams[0]?.id || null) : selectedTeamId}
          userTeams={userTeams}
        />
      )}

      {isEditModalOpen && selectedTicket && (
        <EditTicketModal 
          ticket={selectedTicket}
          onClose={() => { setIsEditModalOpen(false); setSelectedTicket(null); }} 
          onTicketUpdated={fetchTickets}
          userTeams={userTeams}
        />
      )}
    </div>
  );
};

export default Tickets;
