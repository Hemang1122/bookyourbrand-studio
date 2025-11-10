'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays } from 'lucide-react';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { isSameDay, parseISO } from 'date-fns';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function ProjectCalendarCard() {
  const { user } = useAuth();
  const { projects, isLoading } = useData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const projectsForDate = (projects || [])
    .filter(p => p.team_ids?.includes(user?.id || ''))
    .filter(p => selectedDate && isSameDay(parseISO(p.startDate), selectedDate));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">My Project Starts</CardTitle>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className='flex justify-center'>
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border p-0"
            />
        </div>
        <div className='space-y-2'>
            <h4 className="text-sm font-medium">Projects starting on selected date:</h4>
            <ScrollArea className="h-32 rounded-md border">
                <div className='p-2 space-y-2'>
                {isLoading ? <p className='text-sm text-muted-foreground p-2'>Loading...</p> : null}
                {!isLoading && projectsForDate.length === 0 ? (
                    <p className="p-4 text-center text-xs text-muted-foreground">
                        No projects starting on this day.
                    </p>
                ) : (
                    projectsForDate.map(p => (
                        <Link href={`/projects/${p.id}`} key={p.id}>
                            <div className='p-2 rounded-md hover:bg-muted text-xs'>
                                <p className='font-semibold truncate'>{p.name}</p>
                                <div className='flex justify-between items-center'>
                                     <p className='text-muted-foreground'>{p.client.name}</p>
                                     <Badge variant="outline">{p.status}</Badge>
                                </div>
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
