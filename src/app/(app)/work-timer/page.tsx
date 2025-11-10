'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import type { TimerSession } from '@/lib/types';
import { format } from 'date-fns';
import { ReportDialog } from '../dashboard/components/report-dialog';

// Helper to get a value from localStorage, keyed by user ID
const getLocalStorage = (key: string, userId: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue;
    const userKey = `${key}_${userId}`;
    const storedValue = window.localStorage.getItem(userKey);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
};

export default function WorkTimerPage() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [allSessions, setAllSessions] = useState<TimerSession[]>([]);
    const [isReportOpen, setIsReportOpen] = useState(false);

    // Effect to load sessions from local storage when the component mounts or user changes
    useEffect(() => {
        if (user?.id) {
            const sessions = getLocalStorage('timerAllSessions', user.id, []);
            setAllSessions(sessions);
        }
    }, [user?.id]);
    
    const sessionsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return allSessions.filter(session => session.date === dateStr);
    }, [selectedDate, allSessions]);

    const totalTimeForSelectedDate = useMemo(() => {
        return sessionsForSelectedDate.reduce((total, session) => {
            return total + (session.endTime ? session.endTime - session.startTime : 0);
        }, 0);
    }, [sessionsForSelectedDate]);

    const formatTime = (ms: number) => {
        if (ms < 0) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    if (!user) {
        return null; // Or a loading state
    }

    return (
        <>
            <div className="space-y-8">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Session History</h2>
                    <p className="text-muted-foreground">
                        Review your past work sessions and download reports.
                    </p>
                </div>

                <Card>
                        <CardHeader>
                        <CardTitle>Session History</CardTitle>
                        <CardDescription>Select a date to view your logged sessions.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md border"
                            />
                        </div>
                        <div className='space-y-4'>
                                <Card className="bg-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Summary for {selectedDate ? format(selectedDate, 'PPP') : '...'}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y max-h-60 overflow-y-auto">
                                        {sessionsForSelectedDate.length > 0 ? (
                                            sessionsForSelectedDate.map(session => (
                                                <div key={session.id} className="py-2 flex justify-between items-center">
                                                    <p className="font-medium text-sm truncate pr-2">{session.name}</p>
                                                    <p className="font-mono text-sm">{formatTime(session.endTime! - session.startTime)}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-sm text-muted-foreground py-4">No sessions for this date.</p>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex justify-between items-center font-bold">
                                        <p>Total</p>
                                        <p className="font-mono">{formatTime(totalTimeForSelectedDate)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                                <Button 
                                className="w-full" 
                                onClick={() => setIsReportOpen(true)}
                                disabled={sessionsForSelectedDate.length === 0}
                            >
                                <Download className="mr-2 h-4 w-4" /> Download Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedDate && (
                <ReportDialog
                    open={isReportOpen}
                    onOpenChange={setIsReportOpen}
                    sessions={sessionsForSelectedDate}
                    totalTime={totalTimeForSelectedDate}
                    reportDate={selectedDate}
                />
            )}
        </>
    );
}
