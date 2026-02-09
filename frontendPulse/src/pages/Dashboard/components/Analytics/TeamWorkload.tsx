import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';

interface TeamWorkloadProps {
  data: { name: string; count: number }[];
}

const TeamWorkload: React.FC<TeamWorkloadProps> = ({ data }) => {
  return (
    <Card className="p-8 lg:col-span-2">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Assignee Workload</h3>
        <Badge variant="emerald" size="sm" className="font-bold border">
          Active Tickets
        </Badge>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888810" />
            <XAxis 
              type="number" 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false} 
              axisLine={false} 
              width={100}
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
            <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TeamWorkload;
