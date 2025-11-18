
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ListChecks, UserCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../data-provider';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';


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

    const [reportedToAdmin, setReportedToAdmin] = useState(false);

    const eightHoursInMs = 8 * 60 * 60 * 1000;
    const isWorkGoalMet = elapsedTime >= eightHoursInMs;

    // Load states from localStorage on mount
    useEffect(() => {
        if (user) {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const storedDate = getLocalStorage('checklistDate', user.id, null);

            if (storedDate === todayStr) {
                setReportedToAdmin(getLocalStorage('adminReported', user.id, false));
            } else {
                // It's a new day, reset all daily stored values
                setLocalStorage('checklistDate', user.id, todayStr);
                setLocalStorage('adminReported', user.id, false);
                setReportedToAdmin(false);
            }
        }
    }, [user]);

    // Derived scrum status from data provider
    const hasSubmittedScrum = scrumUpdates.some(update =>
        update.userId === user?.id && isSameDay(new Date(update.timestamp), new Date())
    );

    const handleReportedToAdmin = () => {
        if (user && !reportedToAdmin) {
            setReportedToAdmin(true);
            setLocalStorage('adminReported', user.id, true);
        }
    };
    
    const ChecklistItem = ({ icon, title, description, isComplete, children }: { icon: React.ElementType, title: string, description: string, isComplete: boolean, children?: React.ReactNode }) => (
      <div className="flex items-start gap-4">
        {isComplete ? <CheckCircle className="h-6 w-6 text-green-500 mt-1" /> : <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />}
        <div className="flex-1 space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {children}
        </div>
      </div>
    );


    if (!user) return null;

    return (
        <Card className="sticky top-4">
            <CardHeader>
                <CardTitle className="text-lg">Daily Completion Checklist</CardTitle>
                <CardDescription>Your mandatory daily responsibilities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                
                <ChecklistItem 
                    icon={Clock}
                    title="8-Hour Work Timer"
                    description="Your daily minimum work duration requirement."
                    isComplete={isWorkGoalMet}
                >
                  <Badge variant={isWorkGoalMet ? 'secondary' : 'destructive'} className={cn(isWorkGoalMet && "bg-green-600/20 text-green-400 border-green-600/30")}>
                    {isWorkGoalMet ? 'Completed' : 'Incomplete'}
                  </Badge>
                </ChecklistItem>

                <ChecklistItem 
                    icon={ListChecks}
                    title="Scrum Sheet"
                    description="Submit your daily tasks and blockers."
                    isComplete={hasSubmittedScrum}
                >
                    {!hasSubmittedScrum ? (
                        <Button asChild size="sm" variant="destructive" className="h-7 px-2">
                           <Link href="/scrum">Incomplete</Link>
                        </Button>
                    ) : (
                        <Badge variant='secondary' className="bg-green-600/20 text-green-400 border-green-600/30">Completed</Badge>
                    )}
                </ChecklistItem>

                <ChecklistItem 
                    icon={UserCheck}
                    title="Reporting to Admin"
                    description="Confirm that you have reported your daily progress to Nidhi Ma'am."
                    isComplete={reportedToAdmin}
                >
                    {!reportedToAdmin ? (
                        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={handleReportedToAdmin}>
                           Incomplete
                        </Button>
                    ) : (
                        <Badge variant='secondary' className="bg-green-600/20 text-green-400 border-green-600/30">Completed</Badge>
                    )}
                </ChecklistItem>
            </CardContent>
        </Card>
    );
}
