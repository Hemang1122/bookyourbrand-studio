'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
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
    { name: 'Pending', total: tasks.filter(t => t.status === 'Pending').length },
    { name: 'In Progress', total: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Completed', total: tasks.filter(t => t.status === 'Completed').length },
  ];

  return (
    <ChartContainer config={{
        total: {
          label: "Tasks",
          color: "hsl(var(--primary))",
        },
      }} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={350}>
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
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
