import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../../../components/ui/Card';

interface DistributionPieChartProps {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  colorOffset?: number;
}

const DistributionPieChart: React.FC<DistributionPieChartProps> = ({ 
  title, 
  data, 
  colors, 
  innerRadius = 70, 
  outerRadius = 100, 
  paddingAngle = 4,
  colorOffset = 0
}) => {
  return (
    <Card className="p-8">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-8 tracking-tight">{title}</h3>
      <div className="h-[300px] w-full flex flex-col items-center justify-center gap-6">
        <div className="relative w-full h-full max-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={paddingAngle}
                dataKey="value"
                stroke="none"
              >
                {data.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[(index + colorOffset) % colors.length]}
                    className="hover:opacity-80 transition-opacity outline-none"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', 
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full pt-4 border-t border-slate-100 dark:border-white/5">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: colors[(index + colorOffset) % colors.length] }}
                ></div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 capitalize whitespace-nowrap">
                  {entry.name}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default DistributionPieChart;
