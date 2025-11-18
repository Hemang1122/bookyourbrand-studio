'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, ListChecks, MessageSquareWarning, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../data-provider';
import { format, isSameDay } from 'date-fns';
import Link from 'next/link';

// Helper to get a value from localStorage, keyed by user ID
const getLocalStorage = (key: string, userId: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue;
    const userKey = `${key}_${userId}`;
    const storedValue = window.localStorage.getItem(userKey);
    try {
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (e) {
        console.error("Error parsing localStorage item", e);
        return defaultValue;
    }
};

// Helper to set a value in localStorage, keyed by user ID
const setLocalStorage = (key: string, userId: string, value: any) => {
    if (typeof window !== 'undefined') {
        const userKey = `${key}_${userId}`;
        window.localStorage.setItem(userKey, JSON.stringify(value));
    }
};


type EditorResponsibilityPanelProps = {
    elapsedTime: number;
};

export function EditorResponsibilityPanel({ elapsedTime }: EditorResponsibilityPanelProps) {
    const { user } = useAuth();
    const { scrumUpdates } = useData();
    
    // State for daily reporting
    const [hasReportedToAdmin, setHasReportedToAdmin] = useState(false);
    
    const eightHoursInMs = 8 * 60 * 60 * 1000;
    const workProgress = Math.min((elapsedTime / eightHoursInMs) * 100, 100);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    };

    // Scrum status logic
    const today = new Date();
    const hasSubmittedScrum = scrumUpdates.some(update => 
        update.userId === user?.id && isSameDay(new Date(update.timestamp), today)
    );
    const scrumStatus = hasSubmittedScrum ? 'Submitted' : 'Pending';
    const isAfter7PM = today.getHours() >= 19;
    
    // Reporting status logic
    useEffect(() => {
        if (user) {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const storedDate = getLocalStorage('reportingDate', user.id, null);
            if (storedDate === todayStr) {
                setHasReportedToAdmin(getLocalStorage('hasReported', user.id, false));
            } else {
                 setLocalStorage('reportingDate', user.id, todayStr);
                 setLocalStorage('hasReported', user.id, false);
                 setHasReportedToAdmin(false);
            }
        }
    }, [user]);

    const handleReportNow = () => {
        if (user) {
            setHasReportedToAdmin(true);
            setLocalStorage('hasReported', user.id, true);
        }
    };
    
    if (!user) return null;

    return (
        <Card className="sticky top-4">
            <CardHeader>
                <CardTitle className="text-lg">Editor Responsibility Panel</CardTitle>
                <CardDescription>Your mandatory daily checklist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Work Hours Tracker */}
                <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2"><Clock className="text-primary"/>Work Hours Logged Today</h4>
                     <div className="space-y-1">
                        <div className="flex justify-between items-baseline">
                             <p className="font-mono text-xl font-bold text-primary">{formatTime(elapsedTime)}</p>
                             <p className="text-xs text-muted-foreground">Goal: 08h 00m</p>
                        </div>
                        <Progress value={workProgress} />
                    </div>
                     {workProgress < 100 ? (
                         <Alert variant="default" className="border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
                             <AlertCircle className="h-4 w-4" />
                             <AlertDescription className="text-xs">
                                Work Timer must reach 8 hours.
                             </AlertDescription>
                         </Alert>
                     ) : (
                         <div className="flex items-center gap-2 text-sm text-green-600">
                             <CheckCircle className="h-4 w-4"/>
                             <span>Daily goal met. Well done!</span>
                         </div>
                     )}
                </div>

                {/* Scrum Sheet Status */}
                <div className="space-y-3">
                     <h4 className="font-medium text-sm flex items-center gap-2"><ListChecks className="text-primary"/>Scrum Sheet</h4>
                     <div className="flex items-center justify-between">
                         <p>Status: <span className={scrumStatus === 'Submitted' ? "font-semibold text-green-600" : "font-semibold text-amber-600"}>{scrumStatus}</span></p>
                         {scrumStatus !== 'Submitted' && (
                             <Button asChild size="sm">
                                 <Link href="/scrum">Fill Now</Link>
                             </Button>
                         )}
                     </div>
                      {scrumStatus === 'Pending' && isAfter7PM && (
                         <Alert variant="destructive">
                             <AlertCircle className="h-4 w-4" />
                             <AlertDescription className="text-xs">
                                Scrum Sheet must be filled daily. Please submit now.
                             </AlertDescription>
                         </Alert>
                     )}
                </div>
                
                {/* Daily Reporting Status */}
                <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2"><UserCheck className="text-primary"/>Daily Reporting to Admin</h4>
                     <div className="flex items-center justify-between">
                         <p>Status: <span className={hasReportedToAdmin ? "font-semibold text-green-600" : "font-semibold text-amber-600"}>{hasReportedToAdmin ? 'Reported' : 'Not Reported'}</span></p>
                         <div className="flex items-center gap-2">
                             <span className="text-xs text-muted-foreground hidden sm:inline">Admin: Niddhi Ma'am</span>
                            {!hasReportedToAdmin && <Button size="sm" onClick={handleReportNow}>Mark as Reported</Button>}
                         </div>
                     </div>
                     {!hasReportedToAdmin && (
                         <Alert variant="default" className="border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
                             <AlertCircle className="h-4 w-4" />
                             <AlertDescription className="text-xs">
                                Niddhi Mam ko daily report karna mandatory.
                             </AlertDescription>
                         </Alert>
                     )}
                </div>
            </CardContent>
        </Card>
    );
}
