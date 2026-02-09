import React from 'react';
import { Ticket as TicketIcon, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import PremiumStatCard from '../Overview/PremiumStatCard';
import type { AnalyticsData } from '../../hooks/useAnalyticsData';

interface AnalyticsOverviewProps {
  data: AnalyticsData | null;
  timeRange: string;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ data, timeRange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <PremiumStatCard 
        title="Total Tickets"
        value={data?.total || 0}
        icon={TicketIcon}
        color="#3b82f6"
        trend={`+${data?.trends.total || 0}%`}
      />

      <PremiumStatCard 
        title="Avg Urgency"
        value={data?.urgency_avg.toFixed(2) || '0.00'}
        icon={AlertCircle}
        color="#f59e0b"
        trend={data?.trends.urgency ? `${data.trends.urgency.toFixed(2)}%` : undefined}
      />

      <PremiumStatCard 
        title="Daily Velocity"
        value={data ? (data.total / (timeRange === '7d' ? 7 : 30)).toFixed(2) : 0}
        icon={CheckCircle2}
        color="#10b981"
        trend={data?.trends.velocity ? `${data.trends.velocity.toFixed(2)} t/d` : undefined}
      />

      <PremiumStatCard 
        title="Pulse Activity"
        value={`+${data?.daily_trends[data.daily_trends.length - 1]?.count || 0}`}
        icon={TrendingUp}
        color="#6366f1"
        trend="Today"
      />
    </div>
  );
};

export default AnalyticsOverview;
