'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { Task } from '@/lib/types';
import {
  ChartTooltipContent,
  ChartContainer,
} from '@/components/ui/chart';


type OverviewChartProps = {
  tasks: Task[];
};

export function OverviewChart({ tasks }: OverviewChartProps) {
  const data = [
    { name: 'Pending', total: tasks.filter(t => t.status === 'Pending').length, fill: '#6B7280' },
    { name: 'In Progress', total: tasks.filter(t => t.status === 'In Progress').length, fill: '#7C3AED' },
    { name: 'Rework', total: tasks.filter(t => t.status === 'Rework').length, fill: '#F59E0B' },
    { name: 'Completed', total: tasks.filter(t => t.status === 'Completed').length, fill: '#10B981' },
  ];

  return (
    <ChartContainer config={{
        total: {
          label: "Tasks",
        },
      }} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={256}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
            allowDecimals={false}
          />
           <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
