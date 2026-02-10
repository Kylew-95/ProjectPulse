export interface Tag {
    id: string;
    name: string;
    color: string;
    team_id: string;
}

export interface Ticket {
    id: string | number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    type?: string | null;
    created_at: string;
    assignee: string | null;
    reporter?: string | null;
    assignee_id: string | null;
    team_id: string;
    urgency_score: number | null;
    position: number | null;
    assignee_full_name?: string | null;
    assignee_avatar_url?: string | null;
    reporter_full_name?: string | null;
    reporter_avatar_url?: string | null;
    team_name?: string | null;
    assignee_profile?: { full_name: string; avatar_url: string } | null;
    reporter_profile?: { full_name: string; avatar_url: string } | null;
    teams?: { id: string; name: string } | null;
    tags?: Tag[];
}

