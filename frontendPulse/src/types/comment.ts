export interface Comment {
    id: number;
    ticket_id: number;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    profile?: {
        full_name: string | null;
        avatar_url: string | null;
        email: string | null;
    };
}
