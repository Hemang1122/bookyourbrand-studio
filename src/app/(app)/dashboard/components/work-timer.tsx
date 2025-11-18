'use client';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Play, StopCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/firebase/provider';
import type { TimerSession } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { SaveSessionDialog } from './save-session-dialog';

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

type WorkTimerProps = {
  onTimeUpdate: (time: number) => void;
};

export function WorkTimer({ onTimeUpdate }: WorkTimerProps) {
  const { user } = useAuth();
  const userId = user?.id;

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSessionStart, setCurrentSessionStart] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // State for the session saving dialog
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [sessionToSave, setSessionToSave] = useState<Omit<TimerSession, 'name' | 'date'> | null>(null);

  // Expose time update to parent
  useEffect(() => {
    onTimeUpdate(elapsedTime);
  }, [elapsedTime, onTimeUpdate]);


  // Load state from localStorage on initial client-side render
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const storedDate = getLocalStorage('timerDate', userId, null);

    if (storedDate !== todayStr) {
      setLocalStorage('timerRunning', userId, false);
      setLocalStorage('timerCurrentSessionStart', userId, 0);
      setLocalStorage('timerElapsedTimeToday', userId, 0);
      setLocalStorage('timerDate', userId, todayStr);
      setIsRunning(false);
      setElapsedTime(0);
      setCurrentSessionStart(0);
    } else {
        const running = getLocalStorage('timerRunning', userId, false);
        const startTime = getLocalStorage('timerCurrentSessionStart', userId, 0);
        const savedElapsedTime = getLocalStorage('timerElapsedTimeToday', userId, 0);

        setIsRunning(running);
        setCurrentSessionStart(startTime);
        
        if (running && startTime > 0) {
          setElapsedTime(savedElapsedTime + (Date.now() - startTime));
        } else {
          setElapsedTime(savedElapsedTime);
        }
    }
    setIsInitialized(true);
  }, [userId]);
  
  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && userId) {
      interval = setInterval(() => {
        const savedElapsedTime = getLocalStorage('timerElapsedTimeToday', userId, 0);
        const startTime = getLocalStorage('timerCurrentSessionStart', userId, Date.now());
        setElapsedTime(savedElapsedTime + (Date.now() - startTime));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, userId]);

  const handleStart = () => {
    if (isRunning || !userId) return;
    const startTime = Date.now();
    setCurrentSessionStart(startTime);
    setLocalStorage('timerCurrentSessionStart', userId, startTime);
    setLocalStorage('timerRunning', userId, true);
    setIsRunning(true);
  };

  const handleStop = () => {
    if (!isRunning || !userId) return;

    const endTime = Date.now();
    const startTime = currentSessionStart;
    const sessionElapsedTime = endTime - startTime;
    const oldTotalElapsedTime = getLocalStorage('timerElapsedTimeToday', userId, 0);
    const newTotalElapsedTime = oldTotalElapsedTime + sessionElapsedTime;

    // Update today's total elapsed time
    setLocalStorage('timerElapsedTimeToday', userId, newTotalElapsedTime);
    setElapsedTime(newTotalElapsedTime);
    
    // Stop the timer
    setLocalStorage('timerRunning', userId, false);
    setIsRunning(false);
    setCurrentSessionStart(0);
    setLocalStorage('timerCurrentSessionStart', userId, 0);
    
    // Prepare session for saving and open dialog
    setSessionToSave({ id: uuidv4(), startTime, endTime });
    setIsSaveDialogOpen(true);
  };

  const handleSaveSession = (name: string) => {
    if (!sessionToSave || !userId) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newSession: TimerSession = {
      ...sessionToSave,
      name,
      date: todayStr,
    };

    // Get all historical sessions, add the new one, and save back
    const allSessions = getLocalStorage('timerAllSessions', userId, []);
    setLocalStorage('timerAllSessions', userId, [...allSessions, newSession]);
    
    setSessionToSave(null);
  };


  const formatTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (!isInitialized) {
     return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Work Timer</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                <div className="text-center">
                    <p className="font-signature text-5xl text-primary">00:00:00</p>
                    <p className="text-xs text-muted-foreground">Loading timer...</p>
                </div>
                 <div className="flex gap-2">
                    <Button className="w-full" disabled>
                        <Play className="mr-2 h-4 w-4" /> Start Timer
                    </Button>
                </div>
            </CardContent>
        </Card>
     )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Work Timer</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
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
        </CardContent>
      </Card>
      
      {sessionToSave && (
        <SaveSessionDialog
          open={isSaveDialogOpen}
          onOpenChange={setIsSaveDialogOpen}
          onSave={handleSaveSession}
          session={sessionToSave}
        />
      )}
    </>
  );
}
