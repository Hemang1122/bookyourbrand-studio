'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, ListChecks, MessageSquareWarning, CheckCircle, AlertCircle, UserCheck, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../data-provider';
import { format, isSameDay } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LeaveRemarkDialog } from './leave-remark-dialog';
import { cn } from '@/lib/utils';

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

    const [dailyChecks, setDailyChecks] = useState({ reportedToAdmin: false, scrumSubmitted: false });
    const [remarks, setRemarks] = useState({ hoursRemark: '', scrumRemark: '', reportingRemark: '' });
    const [isRemarkDialogOpen, setIsRemarkDialogOpen] = useState(false);
    const [remarkType, setRemarkType] = useState<'hours' | 'scrum' | 'reporting' | null>(null);

    const eightHoursInMs = 8 * 60 * 60 * 1000;
    const workProgress = Math.min((elapsedTime / eightHoursInMs) * 100, 100);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    };

    // Load states from localStorage on mount
    useEffect(() => {
        if (user) {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const storedDate = getLocalStorage('checklistDate', user.id, null);

            if (storedDate === todayStr) {
                setDailyChecks(getLocalStorage('dailyChecks', user.id, { reportedToAdmin: false, scrumSubmitted: false }));
                setRemarks(getLocalStorage('dailyRemarks', user.id, { hoursRemark: '', scrumRemark: '', reportingRemark: '' }));
            } else {
                setLocalStorage('checklistDate', user.id, todayStr);
                setLocalStorage('dailyChecks', user.id, { reportedToAdmin: false, scrumSubmitted: false });
                setLocalStorage('dailyRemarks', user.id, { hoursRemark: '', scrumRemark: '', reportingRemark: '' });
                setDailyChecks({ reportedToAdmin: false, scrumSubmitted: false });
                setRemarks({ hoursRemark: '', scrumRemark: '', reportingRemark: '' });
            }
        }
    }, [user]);

    // Derived scrum status
    const hasSubmittedScrum = scrumUpdates.some(update =>
        update.userId === user?.id && isSameDay(new Date(update.timestamp), new Date())
    );
    const isAfter7PM = new Date().getHours() >= 19;
    
    // Update scrum status in local storage if it's submitted
    useEffect(() => {
        if(user && hasSubmittedScrum && !dailyChecks.scrumSubmitted) {
            handleCheckChange('scrumSubmitted', true);
        }
    }, [hasSubmittedScrum, user, dailyChecks.scrumSubmitted]);

    const handleCheckChange = (key: 'reportedToAdmin' | 'scrumSubmitted', value: boolean) => {
        if (user) {
            const newChecks = { ...dailyChecks, [key]: value };
            setDailyChecks(newChecks);
            setLocalStorage('dailyChecks', user.id, newChecks);
        }
    };

    const handleOpenRemarkDialog = (type: 'hours' | 'scrum' | 'reporting') => {
        setRemarkType(type);
        setIsRemarkDialogOpen(true);
    };

    const handleSaveRemark = (remark: string) => {
        if (user && remarkType) {
            const newRemarks = { ...remarks, [`${remarkType}Remark`]: remark };
            setRemarks(newRemarks);
            setLocalStorage('dailyRemarks', user.id, newRemarks);
        }
    };

    const isWorkGoalMet = workProgress >= 100;

    if (!user) return null;

    return (
        <>
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
                    {isWorkGoalMet ? (
                         <div className="flex items-center gap-2 text-sm text-green-600">
                             <CheckCircle className="h-4 w-4"/>
                             <span>Daily goal met. Well done!</span>
                         </div>
                    ) : (
                         <Alert variant="default" className="border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
                             <AlertCircle className="h-4 w-4" />
                             <AlertDescription className="text-xs flex items-center justify-between">
                                <span>Work Timer must reach 8 hours.</span>
                                 <Button variant="link" size="sm" className="p-0 h-auto text-amber-600" onClick={() => handleOpenRemarkDialog('hours')}>Leave Remark</Button>
                             </AlertDescription>
                         </Alert>
                     )}
                     {remarks.hoursRemark && <p className="text-xs text-muted-foreground italic">Remark: {remarks.hoursRemark}</p>}
                </div>

                {/* Scrum Sheet Status */}
                <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2"><ListChecks className="text-primary"/>Scrum Sheet Submission</h4>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="scrum-check" checked={dailyChecks.scrumSubmitted} onCheckedChange={(checked) => handleCheckChange('scrumSubmitted', !!checked)} disabled={hasSubmittedScrum}/>
                        <Label htmlFor="scrum-check" className={cn("flex-1", dailyChecks.scrumSubmitted && "line-through text-muted-foreground")}>
                           Daily scrum sheet has been submitted.
                        </Label>
                    </div>
                     {!dailyChecks.scrumSubmitted && isAfter7PM && (
                         <Alert variant="destructive">
                             <AlertCircle className="h-4 w-4" />
                             <AlertDescription className="text-xs flex items-center justify-between">
                                <span>Mandatory daily submission is overdue.</span>
                                <Button variant="link" size="sm" className="p-0 h-auto text-destructive" onClick={() => handleOpenRemarkDialog('scrum')}>Leave Remark</Button>
                             </AlertDescription>
                         </Alert>
                     )}
                    {remarks.scrumRemark && <p className="text-xs text-muted-foreground italic">Remark: {remarks.scrumRemark}</p>}
                </div>

                {/* Daily Reporting Status */}
                <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2"><UserCheck className="text-primary"/>Daily Reporting to Admin</h4>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="reporting-check" checked={dailyChecks.reportedToAdmin} onCheckedChange={(checked) => handleCheckChange('reportedToAdmin', !!checked)} />
                        <Label htmlFor="reporting-check" className={cn("flex-1", dailyChecks.reportedToAdmin && "line-through text-muted-foreground")}>
                           Reported my daily status to Niddhi Ma'am.
                        </Label>
                    </div>
                     {!dailyChecks.reportedToAdmin && (
                         <Alert variant="default" className="border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
                             <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs flex items-center justify-between">
                                <span>Niddhi Mam ko daily report karna mandatory.</span>
                                 <Button variant="link" size="sm" className="p-0 h-auto text-amber-600" onClick={() => handleOpenRemarkDialog('reporting')}>Leave Remark</Button>
                             </AlertDescription>
                         </Alert>
                     )}
                     {remarks.reportingRemark && <p className="text-xs text-muted-foreground italic">Remark: {remarks.reportingRemark}</p>}
                </div>
            </CardContent>
        </Card>
        {remarkType && (
            <LeaveRemarkDialog
                open={isRemarkDialogOpen}
                onOpenChange={setIsRemarkDialogOpen}
                onSaveRemark={handleSaveRemark}
                remarkType={remarkType}
                currentRemark={remarks[`${remarkType}Remark`]}
            />
        )}
        </>
    );
}
