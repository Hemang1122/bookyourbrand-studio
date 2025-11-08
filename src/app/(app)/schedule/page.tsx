
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
                Filter projects by team member and start date.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Team Member</Label>
                            <Select onValueChange={setSelectedTeamMemberId} value={selectedTeamMemberId || undefined}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teamMembers.map(member => (
                                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Project Start Date</Label>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md border"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Projects starting on {selectedDate ? format(selectedDate, 'PPP') : '...'}</CardTitle>
                        <CardDescription>
                            {selectedTeamMemberId ? `Assigned to ${teamMembers.find(tm => tm.id === selectedTeamMemberId)?.name}` : 'Select a team member to see projects.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {filteredProjects.length > 0 ? (
                             filteredProjects.map(project => (
                                <div key={project.id} className="flex items-center justify-between rounded-lg border p-4">
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
                                            <Link href={`/projects/${project.id}`}>View Project</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">
                                    {selectedTeamMemberId ? 'No projects starting for this member on this date.' : 'Please select a team member and a date.'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  );
}
