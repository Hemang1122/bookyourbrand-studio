'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Task } from '@/lib/types';

export function OverviewChart({ tasks }: { tasks: Task[] }) {
    const safeTasks = tasks || [];

    const chartData = useMemo(() => [
        { name: 'Pending', Tasks: safeTasks.filter(t => t.status === 'Pending').length },
        { name: 'In Progress', Tasks: safeTasks.filter(t => t.status === 'In Progress').length },
        { name: 'Rework', Tasks: safeTasks.filter(t => t.status === 'Rework').length },
        { name: 'Completed', Tasks: safeTasks.filter(t => t.status === 'Completed').length },
    ], [safeTasks]);

    return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip 
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '12px',
                color: 'white'
              }}
              cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
            />
            <Bar dataKey="Tasks" radius={[6,6,0,0]}>
              {chartData.map((entry, index) => {
                const color = entry.name === 'Pending' ? '#6B7280'
                  : entry.name === 'In Progress' ? '#7C3AED'
                  : entry.name === 'Rework' ? '#F59E0B'
                  : '#10B981';
                return <Cell key={`cell-${index}`} fill={color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
    );
}
