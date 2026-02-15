'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../data-provider';
import { format, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarDays, FolderKanban } from 'lucide-react';

type ProjectCalendarCardProps = {
    selectedDate: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
};

export function ProjectCalendarCard({ selectedDate, onDateChange }: ProjectCalendarCardProps) {
    const { user } = useAuth();
    const { projects } = useData();

    const scheduledProjects = useMemo(() => {
        if (!user || !projects || !selectedDate) return [];
        return projects.filter(p =>
            p.team_ids?.includes(user.id) &&
            p.startDate &&
            isSameDay(new Date(p.startDate), selectedDate)
        );
    }, [user, projects, selectedDate]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                        <CalendarDays className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">My Project Schedule</CardTitle>
                        <CardDescription className="text-xs">Projects you are assigned to, by start date.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                 <div className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={onDateChange}
                        className="rounded-md border"
                    />
                </div>
                 <div className="space-y-3">
                    <h4 className="font-medium text-sm">
                        Projects starting on {selectedDate ? format(selectedDate, 'PPP') : '...'}
                    </h4>
                    <div className="space-y-2">
                        {scheduledProjects.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                                No projects starting on this date.
                            </div>
                        ) : (
                            scheduledProjects.map(project => (
                                <div key={project.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="font-semibold text-sm">{project.name}</p>
                                        <p className="text-xs text-muted-foreground">{project.client.name}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/projects/${project.id}`}>View</Link>
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
