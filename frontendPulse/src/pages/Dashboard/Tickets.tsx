import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

import CreateTicketModal from '../../components/tickets/CreateTicketModal';
import EditTicketModal from '../../components/tickets/EditTicketModal';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import TicketHeader from '../../components/tickets/TicketHeader';
import TicketTable from '../../components/tickets/TicketTable';
import TicketList from '../../components/tickets/TicketList';
import { exportToCSV } from '../../utils/exportUtils';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

import type { Ticket } from '../../types/ticket';

const Tickets = () => {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [userTeams, setUserTeams] = useState<{ id: string; name: string }[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode] = useState<'table' | 'list'>('table');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | number;
  }>({
    isOpen: false,
    id: ''
  });
  
  // States moved to Table: statusFilter, priorityFilter, searchQuery, currentPage, sortByUrgency 
  // We keep 'viewMode' here or move it to header? Kept here for switching between Table/List views if needed.
  // Actually, TicketList is likely duplicate/alternative view. We might want to pass data to it too.
  
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
  }, [session, refreshTrigger]);

  const fetchTickets = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Client-side filtering: Fetch ALL tickets
      // Limiting to reasonably high number if needed, but for now fetch all assigned/related to user
      // or filtering by RLS handled by backend. RLS usually handles "my tickets" or "my team's tickets".
      
      let query = supabase
        .from('tickets')
        .select(`
          *,
          assignee_profile:profiles!tickets_assignee_id_fkey(full_name, avatar_url),
          reporter_profile:profiles!tickets_reporter_id_fkey(full_name, avatar_url),
          teams(name)
        `)
        .order('created_at', { ascending: false });

      // If we want to support server-side filtering later we can add it back, 
      // but for now we fetch all relevant tickets.
      
      const { data, error } = await query;
      
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [session, refreshTrigger]);

  const handleDelete = async (id: string | number) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', deleteModal.id);
      if (error) throw error;
      setTickets(prev => prev.filter(t => t.id !== deleteModal.id));
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      console.error('Error deleting ticket:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
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
        {/* TicketFilters removed - logic moved to Table */}
        
        {viewMode === 'table' ? (
          <TicketTable 
            tickets={tickets}
            loading={loading}
            userTeams={userTeams}
            onEdit={(t) => { setSelectedTicket(t); setIsEditModalOpen(true); }}
            onDelete={handleDelete}
          />
        ) : (
          <TicketList 
            tickets={tickets}
            loading={loading}
            // For List view, might need to pass plain pagination props if it doesn't support client-side yet,
            // or we might need to refactor TicketList too.
            // Assuming TicketList is legacy or alternative view.
            // For now, focus on Table view refactor.
            totalCount={tickets.length}
            currentPage={1}
            pageSize={1000}
            onEdit={(t) => { setSelectedTicket(t); setIsEditModalOpen(true); }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {isModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsModalOpen(false)} 
          onTicketCreated={fetchTickets}
          teamId={userTeams[0]?.id || null} 
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

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        loading={loading}
      />
    </div>
  );
};

export default Tickets;
