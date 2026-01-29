export interface Ticket {
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
    urgency_score: number | null;
    assignee_profile?: { full_name: string; avatar_url: string };
    reporter_profile?: { full_name: string; avatar_url: string };
    team?: { name: string };
    teams?: { name: string };
}
