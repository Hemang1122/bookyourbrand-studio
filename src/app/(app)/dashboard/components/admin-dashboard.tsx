'use client';

import { useData } from '../../data-provider';
import { useMemo, useState, useEffect } from 'react';
import { subDays, isAfter, format, isSameDay } from 'date-fns';
import { Users, FolderKanban, CheckCircle2, Activity, TrendingUp, CalendarDays, Video, Zap, FolderPlus, UserPlus, BarChart3, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';


export function AdminDashboard() {
    const { projects, tasks, isLoading, clients } = useData();
    const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
    const router = useRouter();

    const safeTasks = tasks || [];
    const safeProjects = projects || [];
    const safeClients = clients || [];

    const stats = useMemo(() => {
        const oneWeekAgo = subDays(new Date(), 7);
        
        let tasksCompletedThisWeek = 0;
        if(safeTasks.length > 0 && Array.isArray(safeTasks[0]?.remarks)) {
           tasksCompletedThisWeek = safeTasks.filter(t => t.status === 'Completed' && t.remarks.some(r => r.toStatus === 'Completed' && isAfter(new Date(r.timestamp), oneWeekAgo))).length;
        }

        const recentActivityCount = safeTasks.reduce((count, task) => {
            const recentRemarks = (task.remarks || []).filter(remark => 
                isAfter(new Date(remark.timestamp), subDays(new Date(), 1))
            ).length;
            return count + recentRemarks;
        }, 0);

        let activityLevel = 'Low';
        if (recentActivityCount > 5) activityLevel = 'High';
        else if (recentActivityCount > 0) activityLevel = 'Medium';

        return {
            totalClients: safeClients.length,
            activeProjects: safeProjects.filter(p => p.status === 'Active' || p.status === 'In Progress').length,
            totalProjects: safeProjects.length,
            tasksCompleted: tasksCompletedThisWeek,
            teamActivity: activityLevel,
        }
    }, [safeTasks, safeProjects, safeClients]);
    
    const chartData = [
        { name: 'Pending', Tasks: safeTasks.filter(t => t.status === 'Pending').length },
        { name: 'In Progress', Tasks: safeTasks.filter(t => t.status === 'In Progress').length },
        { name: 'Rework', Tasks: safeTasks.filter(t => t.status === 'Rework').length },
        { name: 'Completed', Tasks: safeTasks.filter(t => t.status === 'Completed').length },
    ];
    
    const scheduledProjects = useMemo(() => {
        if (!calendarDate) return [];
        return safeProjects.filter(p => p.startDate && isSameDay(new Date(p.startDate), calendarDate)).map(p => ({
            id: p.id,
            name: p.name,
            clientName: p.client.name,
        }));
    }, [safeProjects, calendarDate]);


  return (
    <div className="space-y-4">
        {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
            {
            label: 'Total Clients',
            value: stats.totalClients,
            sub: '+3 since last week',
            icon: Users,
            color: '#7C3AED',
            gradient: 'from-purple-600/20 to-purple-900/10',
            },
            {
            label: 'Active Projects', 
            value: stats.activeProjects,
            sub: `of ${stats.totalProjects} total projects`,
            icon: FolderKanban,
            color: '#3B82F6',
            gradient: 'from-blue-600/20 to-blue-900/10',
            },
            {
            label: 'Tasks Completed',
            value: `+${stats.tasksCompleted}`,
            sub: 'this week',
            icon: CheckCircle2,
            color: '#10B981',
            gradient: 'from-emerald-600/20 to-emerald-900/10',
            },
            {
            label: 'Team Activity',
            value: stats.teamActivity,
            sub: 'across task list',
            icon: Activity,
            color: '#EC4899',
            gradient: 'from-pink-600/20 to-pink-900/10',
            },
        ].map((stat, i) => (
            <div key={stat.label}
                className={`animate-fade-up stagger-${i + 2}
                            rounded-2xl p-5 border
                            bg-gradient-to-br ${stat.gradient}
                            hover:scale-[1.02] transition-all
                            duration-300 cursor-default group`}
                style={{borderColor: stat.color + '30'}}>
            
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl"
                    style={{background: stat.color + '20',
                            animation: 'pulse-glow 3s ease infinite'}}>
                <stat.icon className="h-5 w-5"
                            style={{color: stat.color}} />
                </div>
                <TrendingUp className="h-4 w-4 text-green-400 
                                    opacity-0 group-hover:opacity-100
                                    transition-opacity" />
            </div>
            
            <p className="text-3xl font-bold text-white mb-1"
                style={{animation: 'countUp 0.8s ease forwards'}}>
                {isLoading ? '...' : stat.value}
            </p>
            <p className="text-sm font-medium text-white/80 mb-1">
                {stat.label}
            </p>
            <p className="text-xs text-muted-foreground">
                {stat.sub}
            </p>
            </div>
        ))}
        </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 rounded-2xl p-6 bg-[#13131F] border border-white/5 animate-fade-left stagger-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">Task Progress</h3>
              <p className="text-xs text-muted-foreground mt-1">Overview of all task statuses</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {[
                {label:'Pending', color:'#6B7280'},
                {label:'In Progress', color:'#7C3AED'},
                {label:'Rework', color:'#F59E0B'},
                {label:'Completed', color:'#10B981'},
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{background: l.color}} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          
          <div style={{height: '240px'}}>
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
                  }} />
                <Bar dataKey="Tasks" radius={[6,6,0,0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={
                      entry.name === 'Pending' ? '#6B7280'
                      : entry.name === 'In Progress' ? '#7C3AED'
                      : entry.name === 'Rework' ? '#F59E0B'
                      : '#10B981'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="lg:col-span-2 rounded-2xl p-6 bg-[#13131F] border border-white/5 animate-fade-right stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <CalendarDays className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">Project Schedule</h3>
          </div>
          
          <div className="scale-90 origin-top -mx-2">
            <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={setCalendarDate}
                className="rounded-md"
            />
          </div>
          
          <div className="mt-2 space-y-2">
            {scheduledProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No projects starting today
              </p>
            ) : (
              scheduledProjects.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  <p className="text-xs text-white truncate flex-1">{p.name}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{p.clientName}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 animate-fade-up stagger-5 border border-purple-500/20"
            style={{background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <Video className="h-4 w-4 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Daily Standup</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-white font-medium">10:00 AM Daily</p>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">Join the daily standup call to sync with your team</p>
          
          <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 hover:opacity-90 transition-opacity">
            <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4 mr-2" />
              Join Meeting
            </a>
          </Button>
        </div>

        <div className="rounded-2xl p-6 animate-fade-up stagger-6 bg-[#13131F] border border-white/5">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-pink-500/10">
                    <Zap className="h-4 w-4 text-pink-400" />
                </div>
                <h3 className="font-semibold text-white">Quick Actions</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
            {[
                { label: 'Add Project', icon: FolderPlus, href: '/projects', color: '#7C3AED' },
                { label: 'Add Client', icon: UserPlus, href: '/clients', color: '#EC4899' },
                { label: 'View Reports', icon: BarChart3, href: '/reports', color: '#10B981' },
                { label: 'Team Chat', icon: MessageSquare, href: '/support', color: '#3B82F6' },
            ].map(action => (
                <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="flex items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-purple-500/20 transition-all duration-200 text-left group"
                >
                <div className="p-1.5 rounded-lg" style={{background: action.color + '20'}}>
                    <action.icon className="h-4 w-4" style={{color: action.color}} />
                </div>
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                    {action.label}
                </span>
                </button>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}
