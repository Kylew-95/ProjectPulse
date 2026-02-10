import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import type { Ticket } from '../../../types/ticket';

export interface AnalyticsData {
    total: number;
    active_issues: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_type: Record<string, number>;
    urgency_avg: number;
    daily_trends: { date: string; count: number }[];
    workload: { name: string; count: number }[];
    recent_tickets: { title: string; status: string; priority: string; assignee: string }[];
    heatmap: { day: string; hour: number; count: number }[];
    total_teams: number;
    team_structure: { name: string; members: string[] }[];
    trends: {
        total: number | null;
        active: number | null;
        urgency: number | null;
        velocity: number | null;
    };
}


export type TimeRange = '7d' | '30d' | 'all';


export const useAnalyticsData = (timeRange: TimeRange) => {
    const { user } = useAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: tickets, error } = await supabase
                .from('tickets_view')
                .select(`
                    id,
                    title,
                    status,
                    priority,
                    type,
                    urgency_score,
                    created_at,
                    assignee_full_name
                `)
                .returns<Ticket[]>();

            if (error) throw error;

            const getDaysAgo = (days: number) => {
                const d = new Date();
                d.setDate(d.getDate() - days);
                return d;
            };

            let currentPeriodTickets = tickets || [];
            let previousPeriodTickets: Ticket[] = [];

            if (timeRange === '7d') {
                const sevenDaysAgo = getDaysAgo(7);
                const fourteenDaysAgo = getDaysAgo(14);
                currentPeriodTickets = (tickets || []).filter(t => new Date(t.created_at) >= sevenDaysAgo);
                previousPeriodTickets = (tickets || []).filter(t => {
                    const date = new Date(t.created_at);
                    return date >= fourteenDaysAgo && date < sevenDaysAgo;
                });
            } else if (timeRange === '30d') {
                const thirtyDaysAgo = getDaysAgo(30);
                const sixtyDaysAgo = getDaysAgo(60);
                currentPeriodTickets = (tickets || []).filter(t => new Date(t.created_at) >= thirtyDaysAgo);
                previousPeriodTickets = (tickets || []).filter(t => {
                    const date = new Date(t.created_at);
                    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
                });
            }

            // Fetch team structure (names and member names) robustly
            const { data: teamsRaw, error: teamError } = await supabase
                .from('teams')
                .select('id, name');

            if (teamError) throw teamError;

            const { data: membersRaw, error: membersError } = await supabase
                .from('team_members')
                .select('team_id, user_id');

            if (membersError) throw membersError;

            const allUserIds = [...new Set((membersRaw || []).map(m => m.user_id))];
            const profilesMap: Record<string, string> = {};

            if (allUserIds.length > 0) {
                const { data: profilesRaw, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', allUserIds);

                if (!profilesError && profilesRaw) {
                    profilesRaw.forEach(p => {
                        const fallbackName = p.email ? p.email.split('@')[0] : 'Unknown';
                        profilesMap[p.id] = p.full_name || fallbackName;
                    });
                }
            }

            const stats: AnalyticsData = {
                total: currentPeriodTickets.length,
                active_issues: currentPeriodTickets.filter(t => !['done', 'closed'].includes((t.status || 'open').toLowerCase())).length,
                by_status: {},
                by_priority: {},
                by_type: {},
                urgency_avg: 0,
                daily_trends: [],
                workload: [],
                recent_tickets: [],
                heatmap: [],
                total_teams: teamsRaw?.length || 0,
                team_structure: (teamsRaw || []).map(t => ({
                    name: t.name,
                    members: (membersRaw || [])
                        .filter(m => m.team_id === t.id)
                        .map(m => profilesMap[m.user_id])
                        .filter(Boolean) as string[]
                })),
                trends: { total: null, active: null, urgency: null, velocity: null }
            };

            if (currentPeriodTickets.length === 0) {
                setData(stats);
                return;
            }

            const trendsMap: Record<string, number> = {};
            (tickets || []).forEach(t => {
                const dateStr = t.created_at.substring(0, 10);
                trendsMap[dateStr] = (trendsMap[dateStr] || 0) + 1;
            });

            let totalUrgency = 0;
            const workloadMap: Record<string, number> = {};
            const heatMap: Record<string, number> = {};
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            currentPeriodTickets.forEach(t => {
                const status = (t.status || 'open').toLowerCase();
                stats.by_status[status] = (stats.by_status[status] || 0) + 1;
                const priority = (t.priority || 'medium').toLowerCase();
                stats.by_priority[priority] = (stats.by_priority[priority] || 0) + 1;
                const ticketType = (t.type || 'support').toLowerCase();
                stats.by_type[ticketType] = (stats.by_type[ticketType] || 0) + 1;

                totalUrgency += (t.urgency_score || 0);

                const assigneeName = t.assignee_full_name || 'Unassigned';
                workloadMap[assigneeName] = (workloadMap[assigneeName] || 0) + 1;

                const dateObj = new Date(t.created_at);
                const day = daysOfWeek[dateObj.getDay()];
                const hour = dateObj.getHours();
                const key = `${day} -${hour} `;
                heatMap[key] = (heatMap[key] || 0) + 1;
            });

            stats.urgency_avg = totalUrgency / currentPeriodTickets.length;

            stats.heatmap = [];
            daysOfWeek.forEach(day => {
                for (let hour = 0; hour < 24; hour++) {
                    stats.heatmap.push({ day, hour, count: heatMap[`${day} -${hour} `] || 0 });
                }
            });

            if (previousPeriodTickets.length > 0) {
                // Total tickets trend
                stats.trends.total = ((currentPeriodTickets.length - previousPeriodTickets.length) / (previousPeriodTickets.length || 1)) * 100;

                // Active issues trend
                const currentActive = stats.active_issues;
                const previousActive = previousPeriodTickets.filter(t => !['done', 'closed'].includes((t.status || 'open').toLowerCase())).length;
                stats.trends.active = previousActive > 0
                    ? ((currentActive - previousActive) / previousActive) * 100
                    : (currentActive > 0 ? 100 : 0);

                // Urgency trend
                const prevUrgencyAvg = previousPeriodTickets.reduce((acc, t) => acc + (t.urgency_score || 0), 0) / previousPeriodTickets.length;
                stats.trends.urgency = stats.urgency_avg - prevUrgencyAvg;

                // Velocity trend
                const daysInPeriod = timeRange === '7d' ? 7 : 30;
                const currentVelocity = currentPeriodTickets.length / daysInPeriod;
                const prevVelocity = previousPeriodTickets.length / daysInPeriod;
                stats.trends.velocity = ((currentVelocity - prevVelocity) / (prevVelocity || 1)) * 100;
            }

            stats.workload = Object.entries(workloadMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            stats.recent_tickets = currentPeriodTickets
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map(t => ({
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    assignee: t.assignee_full_name || 'Unassigned'
                }));

            stats.daily_trends = Object.entries(trendsMap)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            setData(stats);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    }, [user, timeRange]);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('analytics-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    return { data, loading, refresh: fetchData };
};
