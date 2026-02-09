import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../../../components/ui/Card';

interface VolumeTrendsProps {
  data: { date: string; count: number }[];
}

type TimeRange = '7d' | '1m' | '1y' | '5y' ;

const VolumeTrends: React.FC<VolumeTrendsProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7 Days' },
    { value: '1m', label: '1 Month' },
    { value: '1y', label: '1 Year' },
    { value: '5y', label: '5 Years' },
  ];

  // Filter data based on selected time range
  const getFilteredData = () => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
    }

    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const filteredData = getFilteredData();

  return (
    <Card className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4 mb-6 lg:mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Volume Trends</h3>
        
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 dark:bg-white/5 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-100 dark:border-white/5 overflow-x-auto w-full lg:w-auto">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`flex-shrink-0 px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-wide sm:tracking-wider lg:tracking-widest rounded-md sm:rounded-lg transition-all duration-200 ${
                timeRange === option.value
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/10'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {option.value.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false} 
              axisLine={false} 
              dy={10}
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
                fontWeight: 600,
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}
              itemStyle={{ color: '#3b82f6' }}
              cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorCount)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default VolumeTrends;
