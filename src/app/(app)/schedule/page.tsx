
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { format, isSameDay, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

export default function SchedulePage() {
  const { user } = useAuth();
  const { projects, teamMembers } = useData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null);

  if (user?.role !== 'admin') {
     if (typeof window !== 'undefined') {
      redirect('/dashboard');
    }
    return null;
  }

  const filteredProjects = useMemo(() => {
    if (!selectedDate || !selectedTeamMemberId) return [];
    return projects.filter(p => 
        isSameDay(parseISO(p.startDate), selectedDate) && 
        p.team_ids.includes(selectedTeamMemberId)
    );
  }, [projects, selectedDate, selectedTeamMemberId]);

  return (
    <div className="container mx-auto py-10">
        <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Team Schedule</h2>
            <p className="text-muted-foreground">
                Filter projects by team member and start date to see their daily assignments.
            </p>
        </div>
        
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Project Assignments</CardTitle>
                        <CardDescription>
                            {selectedTeamMemberId ? `Viewing projects for ${teamMembers.find(tm => tm.id === selectedTeamMemberId)?.name}` : 'Select a team member.'}
                        </CardDescription>
                    </div>
                     <div className="w-full sm:w-auto">
                        <Select onValueChange={setSelectedTeamMemberId} value={selectedTeamMemberId || undefined}>
                            <SelectTrigger className="w-full sm:w-[240px]">
                                <SelectValue placeholder="Select a team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {teamMembers.map(member => (
                                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                    />
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-center md:text-left">
                        Projects starting on {selectedDate ? format(selectedDate, 'PPP') : '...'}
                    </h3>
                    <div className="border rounded-lg min-h-[200px] p-4 space-y-4">
                        {filteredProjects.length > 0 ? (
                             filteredProjects.map(project => (
                                <div key={project.id} className="flex items-center justify-between rounded-lg border bg-background p-4">
                                    <div>
                                        <h3 className="font-semibold">{project.name}</h3>
                                        <p className="text-sm text-muted-foreground">Client: {project.client.name}</p>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            <span>Deadline: {format(new Date(project.deadline), 'PP')}</span>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-4'>
                                        <Badge variant={project.status === 'Completed' ? 'secondary' : 'default'}>{project.status}</Badge>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/projects/${project.id}`}>View</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 flex items-center justify-center h-full">
                                <p className="text-muted-foreground">
                                    {selectedTeamMemberId ? 'No projects start on this date.' : 'Please select a team member.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
