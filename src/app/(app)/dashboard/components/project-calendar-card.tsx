
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays } from 'lucide-react';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { isSameDay, parseISO, format } from 'date-fns';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ProjectCalendarCardProps = {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
};

export function ProjectCalendarCard({ selectedDate, onDateChange }: ProjectCalendarCardProps) {
  const { user } = useAuth();
  const { projects, isLoading } = useData();
  
  const projectsForDate = useMemo(() => {
    if (!projects || !selectedDate) return [];

    return projects.filter(p => {
      const isCorrectDate = isSameDay(parseISO(p.startDate), selectedDate);
      if (!isCorrectDate) return false;

      if (user?.role === 'admin') {
        return true;
      }
      
      if (user?.role === 'team') {
        return p.team_ids?.includes(user.id);
      }

      // Clients don't see this card, but as a fallback, show their projects.
      if (user?.role === 'client') {
          return p.client.id === user.id;
      }

      return false;
    });
  }, [projects, selectedDate, user]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
            <CalendarDays className="h-5 w-5" />
            Project Schedule
        </CardTitle>
        <CardDescription>
            Select a date to view projects scheduled to start on that day.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className='flex justify-center'>
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateChange}
                className="rounded-md border p-0"
            />
        </div>
        <div className='space-y-2'>
            <h4 className="text-sm font-medium">
                Projects starting on {selectedDate ? format(selectedDate, 'PPP') : '...'}
            </h4>
            <ScrollArea className="h-72 rounded-md border">
                <div className='p-2 space-y-2'>
                {isLoading ? <p className='text-sm text-muted-foreground p-2'>Loading...</p> : null}
                {!isLoading && projectsForDate.length === 0 ? (
                    <p className="p-4 text-center text-xs text-muted-foreground">
                        No projects starting on this day.
                    </p>
                ) : (
                    projectsForDate.map(p => (
                        <Link href={`/projects/${p.id}`} key={p.id}>
                            <div className='p-3 rounded-md hover:bg-muted text-sm border bg-background'>
                                <div className='flex justify-between items-center'>
                                     <p className='font-semibold truncate'>{p.name}</p>
                                     <Badge variant="outline">{p.status}</Badge>
                                </div>
                                <p className='text-xs text-muted-foreground'>{p.client.name}</p>
                            </div>
                        </Link>
                    ))
                )}
                </div>
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
