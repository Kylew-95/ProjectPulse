import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import type { Ticket } from '../../../types/ticket';

export interface AnalyticsData {
    total: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_type: Record<string, number>;
    urgency_avg: number;
    daily_trends: { date: string; count: number }[];
    workload: { name: string; count: number }[];
    recent_tickets: { id: string; title: string; status: string; priority: string; assignee: string }[];
    heatmap: { day: string; hour: number; count: number }[];
    total_teams: number;
    trends: {
        total: number;
        urgency: number;
        velocity: number;
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
                .from('tickets')
                .select(`
          id, 
          title,
          status, 
          priority, 
          type, 
          urgency_score, 
          created_at,
          assignee_profile:profiles!tickets_assignee_id_fkey(full_name)
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

            // Fetch team count separately for accuracy
            const { count: teamCount, error: teamError } = await supabase
                .from('teams')
                .select('*', { count: 'exact', head: true });

            if (teamError) throw teamError;

            const stats: AnalyticsData = {
                total: currentPeriodTickets.length,
                by_status: {},
                by_priority: {},
                by_type: {},
                urgency_avg: 0,
                daily_trends: [],
                workload: [],
                recent_tickets: [],
                heatmap: [],
                total_teams: teamCount || 0,
                trends: { total: 0, urgency: 0, velocity: 0 }
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

                const assigneeName = t.assignee_profile?.full_name || 'Unassigned';
                workloadMap[assigneeName] = (workloadMap[assigneeName] || 0) + 1;

                const dateObj = new Date(t.created_at);
                const day = daysOfWeek[dateObj.getDay()];
                const hour = dateObj.getHours();
                const key = `${day}-${hour}`;
                heatMap[key] = (heatMap[key] || 0) + 1;
            });

            stats.urgency_avg = totalUrgency / currentPeriodTickets.length;

            stats.heatmap = [];
            daysOfWeek.forEach(day => {
                for (let hour = 0; hour < 24; hour++) {
                    stats.heatmap.push({ day, hour, count: heatMap[`${day}-${hour}`] || 0 });
                }
            });

            if (previousPeriodTickets.length > 0) {
                stats.trends.total = ((currentPeriodTickets.length - previousPeriodTickets.length) / previousPeriodTickets.length) * 100;
                const prevUrgencyAvg = previousPeriodTickets.reduce((acc, t) => acc + (t.urgency_score || 0), 0) / previousPeriodTickets.length;
                stats.trends.urgency = stats.urgency_avg - prevUrgencyAvg;

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
                    id: String(t.id),
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    assignee: t.assignee_profile?.full_name || 'Unassigned'
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
