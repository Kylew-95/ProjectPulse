import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
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

interface GetTicketsQuery {
  ticketsCollection: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        status: string;
        priority: string;
        urgency_score: number;
        created_at: string;
        description: string;
        assignee_id: string | null;
        team_id: string;
        assignee_profile: {
          full_name: string;
          avatar_url: string;
        } | null;
        reporter_profile: {
          full_name: string;
          avatar_url: string;
        } | null;
        teams: {
          name: string;
        } | null;
      };
    }>;
  };
}

const Tickets = () => {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [userTeams, setUserTeams] = useState<{ id: string; name: string }[]>([]);

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
  
  // GraphQL Query
  const GET_TICKETS = gql`
    query GetTickets {
      ticketsCollection(orderBy: {created_at: DescNullsLast}) {
        edges {
          node {
            id
            title
            status
            priority
            urgency_score
            created_at
            description
            assignee_id
            team_id
            teams {
              name
            }
          }
        }
      }
    }
  `;

  const { data: graphqlData, loading: graphqlLoading, error: graphqlError, refetch } = useQuery<GetTicketsQuery>(GET_TICKETS, {
    fetchPolicy: 'cache-and-network', // Ensure we check network but show cache
    pollInterval: 5000, // Simple polling for realtime-ish updates, or rely on subscriptions later
  });

  useEffect(() => {
    if (graphqlData?.ticketsCollection?.edges) {
      const fetchProfiles = async () => {
        const rawTickets = graphqlData.ticketsCollection.edges.map((edge) => edge.node);
        
        // Extract unique User IDs
        const userIds = new Set<string>();
        rawTickets.forEach((t) => {
          if (t.assignee_id) userIds.add(t.assignee_id);
          // if (t.reporter_id) userIds.add(t.reporter_id); // Add reporter_id field to query if needed
        });

        const profilesMap: Record<string, { full_name: string; avatar_url: string }> = {};

        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', Array.from(userIds));
            
          profiles?.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
          });
        }

        const mappedTickets = rawTickets.map((t) => ({
          ...t,
          teams: t.teams || undefined,
          assignee: (t.assignee_id && profilesMap[t.assignee_id]?.full_name) || null,
          assignee_profile: (t.assignee_id && profilesMap[t.assignee_id]) || undefined,
          reporter_profile: t.reporter_profile || undefined
        }));

        setTickets(mappedTickets);
        setLoading(false);
      };

      fetchProfiles();
    } else if (graphqlLoading) {
       setLoading(true);
    }
    
    if (graphqlError) {
      console.error('GraphQL Error:', graphqlError);
      setError(graphqlError.message);
      setLoading(false);
    }
  }, [graphqlData, graphqlLoading, graphqlError]);

  // Keep user teams fetch for creating tickets (could be separate query later)
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

  // Manual refresh now just calls refetch
  const refreshData = () => {
    refetch();
  };

  // Realtime subscription can be kept via Supabase or moved to GraphQL subscriptions. 
  // For now, let's rely on polling (pollInterval: 5000) or keep the supabase subscription to trigger refetch.
  useEffect(() => {
    const channel = supabase
      .channel('tickets-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

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
    } catch (err: unknown) {
      console.error('Error deleting ticket:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error: ${message}`);
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

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-6 text-red-600 dark:text-red-400">
          <strong>Error loading tickets:</strong> {error}
        </div>
      )}

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
          onTicketCreated={refreshData}
          teamId={userTeams[0]?.id || null} 
          userTeams={userTeams}
        />
      )}

      {isEditModalOpen && selectedTicket && (
        <EditTicketModal 
          ticket={selectedTicket}
          onClose={() => { setIsEditModalOpen(false); setSelectedTicket(null); }} 
          onTicketUpdated={refreshData}
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
