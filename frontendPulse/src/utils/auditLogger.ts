import { supabase } from '../supabaseClient';

export type AuditAction =
    | 'ticket.create'
    | 'ticket.update'
    | 'ticket.delete'
    | 'ticket.status_change'
    | 'auth.login'
    | 'team.create'
    | 'settings.update';

export const logAuditAction = async (
    action: AuditAction,
    entityType: string,
    entityId?: string | number,
    metadata: Record<string, unknown> = {}
) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn('Cannot log audit action: No authenticated user');
            return;
        }

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                actor_id: user.id,
                action,
                entity_type: entityType,
                entity_id: entityId?.toString(),
                metadata
            });

        if (error) {
            console.error('Failed to log audit action:', error);
        }
    } catch (err) {
        console.error('Error logging audit action:', err);
    }
};
