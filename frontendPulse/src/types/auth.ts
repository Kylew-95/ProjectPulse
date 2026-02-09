import type { Session, User } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    subscription_tier: string | null; // 'starter', 'pro', 'enterprise', 'super_admin'
    status: string; // 'active', 'trialing', 'canceled', 'none'
    trial_end: string | null;
    discord_guild_id?: string | null;
    discord_channel_id?: string | null;
    discord_status?: string | null;
    addons?: string[] | null;
}

export interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}
