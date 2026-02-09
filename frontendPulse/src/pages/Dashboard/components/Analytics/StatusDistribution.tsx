import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';

interface StatusDistributionProps {
  data: { name: string; value: number }[];
}

const StatusDistribution: React.FC<StatusDistributionProps> = ({ data }) => {
  return (
    <Card className="p-8">
       <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Status Distribution</h3>
        <Badge variant="blue" size="sm" className="font-bold border">
          Workflow Health
        </Badge>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false} 
              axisLine={false} 
              dy={10}
              tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px', 
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600
              }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default StatusDistribution;
