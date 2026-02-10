import { useEffect, useState, useRef } from 'react';
import { useQuery as useQueryReact, useMutation as useMutationReact } from '@apollo/client/react';
import type { ExecutionResult } from 'graphql';

import { GET_TICKETS, UPDATE_TICKET, DELETE_TICKET } from '../../graphql/operations';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { LayoutGrid, List as ListIcon, Trash2 } from 'lucide-react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { StrictModeDroppable } from '../../components/tickets/StrictModeDroppable';

import CreateTicketModal from '../../components/tickets/CreateTicketModal';
import EditTicketModal from '../../components/tickets/EditTicketModal';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import TicketHeader from '../../components/tickets/TicketHeader';
import TicketTable from '../../components/tickets/TicketTable';
import KanbanBoard from '../../components/tickets/KanbanBoard';
import { exportToCSV } from '../../utils/exportUtils';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import QuickFilters, { type QuickFilterType } from '../../components/common/QuickFilters';
import BulkActionToolbar from '../../components/tickets/BulkActionToolbar';

import type { Ticket } from '../../types/ticket';

interface GetTicketsQuery {
  tickets_viewCollection: {
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
        position: number | null;
        assignee_full_name: string | null;
        assignee_avatar_url: string | null;
        reporter_full_name: string | null;
        reporter_avatar_url: string | null;
        team_name: string | null;
      };
    }>;
  };
}

interface UpdateTicketData {
  updateticketsCollection: {
    records: { id: string; title: string }[];
  };
}

interface DeleteTicketData {
  deleteFromticketsCollection: {
    records: { id: string }[];
  };
}

const Tickets = () => {
  const { session, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [userTeams, setUserTeams] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');
  const [activeFilter, setActiveFilter] = useState<QuickFilterType>('all');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | number;
  }>({
    isOpen: false,
    id: ''
  });
  const [selectedTicketIds, setSelectedTicketIds] = useState<(string | number)[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);

  console.log('DEBUG: Tickets State:', tickets.length, tickets);
  
  // GraphQL Query (imported)

  const { data: graphqlData, loading: graphqlLoading, error: graphqlError, refetch } = useQueryReact<GetTicketsQuery>(GET_TICKETS, {
    fetchPolicy: 'cache-and-network',
  });

  const [updateTicketMutation] = useMutationReact<UpdateTicketData>(UPDATE_TICKET);
  const [deleteTicketMutation] = useMutationReact<DeleteTicketData>(DELETE_TICKET);

  // Ref to track the last processed data to prevent overwriting optimistic updates with stale data
  const lastProcessedDataRef = useRef<GetTicketsQuery | undefined>(undefined);
  
  // Shielding: Map of ticketId -> { status, position, timestamp } to prevent "snap back"
  const moveShieldsRef = useRef<Map<string | number, { status: string; position: number; timestamp: number }>>(new Map());

  useEffect(() => {
    // Debug logging for state tracking
    console.log('DEBUG: Effect Run:', { 
      graphqlLoading, 
      hasData: !!graphqlData, 
      ticketsLength: tickets.length
    });
    
    if (graphqlError) {
      console.error('GraphQL Error:', graphqlError);
      setError(graphqlError.message);
      setLoading(false);
      return;
    }

    if (graphqlData && graphqlData !== lastProcessedDataRef.current) {
      lastProcessedDataRef.current = graphqlData;

      const edges = graphqlData.tickets_viewCollection?.edges || [];
      console.log('DEBUG: Raw GraphQL Data:', graphqlData);
      console.log('DEBUG: Edges found:', edges.length);
      
      const mappedTickets = edges.map((edge: { node: GetTicketsQuery['tickets_viewCollection']['edges'][0]['node'] }) => {
        const t = edge.node;
        let status = t.status;
        let position = t.position;

        const ticketIdStr = String(t.id);
        const shield = moveShieldsRef.current.get(ticketIdStr);
        
        if (shield) {
          const { status: optStatus, position: optPosition, timestamp } = shield;
          const isRecent = Date.now() - timestamp < 8000;

          if (isRecent) {
            if (status !== optStatus || position !== optPosition) {
              status = optStatus;
              position = optPosition;
            } else {
              moveShieldsRef.current.delete(ticketIdStr);
            }
          } else {
            moveShieldsRef.current.delete(ticketIdStr);
          }
        }

        return {
          ...t,
          status,
          position,
          teams: t.team_name ? { id: t.team_id, name: t.team_name } : undefined,
          assignee: t.assignee_full_name || null,
          assignee_profile: t.assignee_full_name ? { full_name: t.assignee_full_name, avatar_url: t.assignee_avatar_url || '' } : undefined,
          reporter_profile: t.reporter_full_name ? { full_name: t.reporter_full_name, avatar_url: t.reporter_avatar_url || '' } : undefined
        };
      }).sort((a: Ticket, b: Ticket) => (a.position || 0) - (b.position || 0));
      
      console.log('DEBUG: Mapped Tickets:', mappedTickets);

      setTickets(mappedTickets as Ticket[]);
      setLoading(false);
    }
    
    // Fallback: If network is done, ensure local loading is off
    // This handles cases where data ref didn't change but loading finished
    if (!graphqlLoading) {
      setLoading(false);
    }

  }, [graphqlData, graphqlLoading, graphqlError, tickets.length]);

  // Keep user teams fetch for creating tickets
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

  // Fetch profiles for bulk actions
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (data) setProfiles(data);
    };
    fetchProfiles();
  }, []);

  const refreshData = () => {
    refetch();
  };

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

  const handleTicketMoved = async (ticketId: string | number, newStatus: string, newPosition?: number) => {
      // Record move in shields Map (Normalize ID to string)
      if (newPosition !== undefined) {
        moveShieldsRef.current.set(String(ticketId), {
          status: newStatus,
          position: newPosition,
          timestamp: Date.now()
        });
      }

      // Optimistic Update
      setTickets(prev => prev.map(t => 
          t.id === ticketId ? { ...t, status: newStatus, position: newPosition ?? t.position } : t
      ).sort((a, b) => (a.position || 0) - (b.position || 0)));

      try {
          const updateData: { status: string; position?: number } = { status: newStatus };
          if (newPosition !== undefined) {
              updateData.position = newPosition;
          }

          const result: ExecutionResult<UpdateTicketData> = await updateTicketMutation({
            variables: {
              id: ticketId,
              set: updateData
            }
          });
          
          if (result.errors) throw new Error(result.errors[0].message);
      } catch (err) {
          console.error("Failed to move ticket:", err);
          alert("Failed to update position. Reverting...");
          refreshData(); // Revert on failure
      }
  };

  const handleDelete = async (id: string | number) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const result: ExecutionResult<DeleteTicketData> = await deleteTicketMutation({
        variables: { id: deleteModal.id }
      });
      if (result.errors) throw new Error(result.errors[0].message);
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

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside
    if (!destination) return;

    // DROPPED IN DELETE ZONE
    if (destination.droppableId === 'delete-zone') {
        handleDelete(draggableId);
        return;
    }

    // Dropped in same position
    if (
        destination.droppableId === source.droppableId && 
        destination.index === source.index
    ) return;

    // Group tickets by status for calculation
    const groupedTickets = {
        open: tickets.filter(t => t.status === 'open'),
        in_progress: tickets.filter(t => t.status === 'in_progress'),
        review: tickets.filter(t => t.status === 'review'),
        done: tickets.filter(t => t.status === 'done')
    };

    const destStatus = destination.droppableId;
    const destTickets = groupedTickets[destStatus as keyof typeof groupedTickets] || [];
    
    // Filter out the dragging item if it's in the same column to get a clean list for calculation
    const calculationTickets = source.droppableId === destination.droppableId
      ? destTickets.filter(t => String(t.id) !== String(draggableId))
      : destTickets;

    let newPosition: number;

    if (calculationTickets.length === 0) {
        // Empty column
        newPosition = 1000;
    } else if (destination.index === 0) {
        // Dropped at the top
        newPosition = (calculationTickets[0].position || 0) / 2;
    } else if (destination.index >= calculationTickets.length) {
        // Dropped at the bottom
        newPosition = (calculationTickets[calculationTickets.length - 1].position || 0) + 1000;
    } else {
        // Dropped between two items
        const prevItem = calculationTickets[destination.index - 1];
        const nextItem = calculationTickets[destination.index];
        newPosition = ((prevItem.position || 0) + (nextItem.position || 0)) / 2;
    }

    // Notify parent
    handleTicketMoved(draggableId, destStatus, newPosition);
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

  // Filter tickets based on active filter
  const filteredTickets = tickets.filter(ticket => {
    switch (activeFilter) {
      case 'my-tickets':
        return ticket.assignee_id === user?.id;
      case 'unassigned':
        return !ticket.assignee_id;
      case 'high-priority':
        return ticket.priority === 'high' || ticket.priority === 'urgent';
      case 'overdue':
        // TODO: Implement when due_date is added
        return false;
      case 'all':
      default:
        return true;
    }
  });

  // Calculate filter counts
  const filterCounts = {
    all: tickets.length,
    myTickets: tickets.filter(t => t.assignee_id === user?.id).length,
    unassigned: tickets.filter(t => !t.assignee_id).length,
    highPriority: tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
    overdue: 0 // TODO: Implement when due_date is added
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen animate-in fade-in duration-700">
        <Breadcrumbs />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <TicketHeader 
            loading={loading}
            onRefresh={refreshData}
            onExport={handleExport}
            onCreateOpen={() => setIsModalOpen(true)}
        />
        
        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-all ${
                    viewMode === 'table' 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="List View"
            >
                <ListIcon size={18} />
            </button>
            <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-md transition-all ${
                    viewMode === 'board' 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Board View"
            >
                <LayoutGrid size={18} />
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Subtle Delete Bin */}
            <StrictModeDroppable droppableId="delete-zone">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 relative group
                    ${snapshot.isDraggingOver 
                      ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110 animate-pulse' 
                      : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }
                  `}
                  title="Drop here to delete"
                >
                  <Trash2 
                    size={20} 
                    className={`transition-transform duration-300 ${snapshot.isDraggingOver ? 'scale-110' : 'group-hover:scale-110'}`} 
                  />
                  
                  {/* Tooltip on drag */}
                  {snapshot.isDraggingOver && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200">
                      DROP TO DELETE
                    </div>
                  )}

                  {/* Placeholder hidden to prevent layout shift */}
                  <div className="hidden">{provided.placeholder}</div>
                </div>
              )}
            </StrictModeDroppable>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <QuickFilters 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-6 text-red-600 dark:text-red-400">
          <strong>Error loading tickets:</strong> {error}
        </div>
      )}

      <div className="space-y-6 h-full">
        {viewMode === 'table' ? (
          <TicketTable 
            tickets={filteredTickets}
            loading={loading}
            userTeams={userTeams}
            onEdit={(t) => { setSelectedTicket(t); setIsEditModalOpen(true); }}
            onDelete={handleDelete}
          />
        ) : (
          <KanbanBoard 
            tickets={filteredTickets}
            loading={loading}
            onEdit={(t) => { setSelectedTicket(t); setIsEditModalOpen(true); }}
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

      <BulkActionToolbar
        selectedIds={selectedTicketIds}
        onClearSelection={() => setSelectedTicketIds([])}
        onActionComplete={refreshData}
        profiles={profiles}
      />
      </div>
    </DragDropContext>
  );
};

export default Tickets;
