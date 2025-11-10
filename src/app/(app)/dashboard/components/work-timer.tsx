'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Play, StopCircle, FileDown } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ReportDialog } from './report-dialog';
import { useAuth } from '@/firebase/provider';

interface TimerSession {
  startTime: number;
  endTime: number | null;
}

// Helper to get a value from localStorage
const getLocalStorage = (key: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue;
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
};

// Helper to set a value in localStorage
const setLocalStorage = (key: string, value: any) => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
};

export function WorkTimer() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const userId = user?.id; // Make sure we have a unique key per user

  // Load state from localStorage on initial render
  useEffect(() => {
    if (!userId) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const storedDate = getLocalStorage(`timerDate_${userId}`, null);
    
    // If it's a new day, reset everything
    if (storedDate !== todayStr) {
      setLocalStorage(`timerRunning_${userId}`, false);
      setLocalStorage(`timerStartTime_${userId}`, 0);
      setLocalStorage(`timerElapsedTime_${userId}`, 0);
      setLocalStorage(`timerSessions_${userId}`, []);
      setLocalStorage(`timerDate_${userId}`, todayStr);
      setIsRunning(false);
      setElapsedTime(0);
      setSessions([]);
      return;
    }

    const running = getLocalStorage(`timerRunning_${userId}`, false);
    const startTime = getLocalStorage(`timerStartTime_${userId}`, 0);
    const savedElapsedTime = getLocalStorage(`timerElapsedTime_${userId}`, 0);
    const savedSessions = getLocalStorage(`timerSessions_${userId}`, []);

    setIsRunning(running);
    setSessions(savedSessions);
    
    if (running && startTime > 0) {
      // If timer was running, calculate elapsed time since last load
      setElapsedTime(savedElapsedTime + (Date.now() - startTime));
    } else {
      setElapsedTime(savedElapsedTime);
    }
  }, [userId]);
  
  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        const startTime = getLocalStorage(`timerStartTime_${userId}`, Date.now());
        const savedElapsedTime = getLocalStorage(`timerElapsedTime_${userId}`, 0);
        setElapsedTime(savedElapsedTime + (Date.now() - startTime));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, userId]);

  const handleStart = () => {
    if (isRunning) return;
    const startTime = Date.now();
    setLocalStorage(`timerStartTime_${userId}`, startTime);
    setLocalStorage(`timerRunning_${userId}`, true);
    setIsRunning(true);
    setSessions(prev => [...prev, { startTime, endTime: null }]);
  };

  const handleStop = () => {
    if (!isRunning) return;
    const startTime = getLocalStorage(`timerStartTime_${userId}`, 0);
    const savedElapsedTime = getLocalStorage(`timerElapsedTime_${userId}`, 0);
    const sessionElapsedTime = Date.now() - startTime;
    const newTotalElapsedTime = savedElapsedTime + sessionElapsedTime;

    setLocalStorage(`timerElapsedTime_${userId}`, newTotalElapsedTime);
    setLocalStorage(`timerStartTime_${userId}`, 0);
    setLocalStorage(`timerRunning_${userId}`, false);
    setIsRunning(false);
    setElapsedTime(newTotalElapsedTime);

    const updatedSessions = [...sessions];
    const currentSession = updatedSessions.find(s => s.endTime === null);
    if (currentSession) {
        currentSession.endTime = Date.now();
        setSessions(updatedSessions);
        setLocalStorage(`timerSessions_${userId}`, updatedSessions);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <>
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Work Timer</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <p className="font-signature text-5xl text-primary">{formatTime(elapsedTime)}</p>
            <p className="text-xs text-muted-foreground">Total time tracked today</p>
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={handleStart} className="w-full">
                <Play className="mr-2 h-4 w-4" /> Start Timer
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" className="w-full">
                <StopCircle className="mr-2 h-4 w-4" /> Stop Timer
              </Button>
            )}
          </div>
           <Button variant="outline" className="w-full" onClick={() => setIsReportDialogOpen(true)} disabled={sessions.length === 0}>
                <FileDown className="mr-2 h-4 w-4" /> Submit Report
           </Button>
        </CardContent>
      </Card>

      <ReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        sessions={sessions}
        totalTime={elapsedTime}
      />
    </>
  );
}
