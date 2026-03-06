'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/firebase/provider';
import { useFirebaseServices } from '@/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Download, 
  Calendar,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { type TimeEntry } from '@/lib/time-tracking-types';

export default function TimeTrackerPage() {
  const { user } = useAuth();
  const { firestore: db } = useFirebaseServices();
  const { toast } = useToast();
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  
  // History state
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  
  // Stats
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Load time entries
  useEffect(() => {
    if (user && db) {
      loadEntries();
      checkRunningTimer();
    }
  }, [user, db]);

  // Update elapsed time
  useEffect(() => {
    if (isRunning && currentEntry) {
      timerInterval.current = setInterval(() => {
        const start = currentEntry.startTime instanceof Timestamp 
          ? currentEntry.startTime.toDate() 
          : new Date(currentEntry.startTime);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
        setElapsedTime(diff);
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isRunning, currentEntry]);

  // Warn before closing if timer is running
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRunning) {
        e.preventDefault();
        e.returnValue = 'Timer is running! Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRunning]);

  // Filter entries
  useEffect(() => {
    filterEntries();
    calculateStats();
  }, [entries, dateFilter]);

  const checkRunningTimer = async () => {
    if (!user || !db) return;

    try {
      const q = query(
        collection(db, 'timer-sessions'),
        where('userId', '==', user.id),
        where('status', '==', 'running')
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const runningEntry = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        } as TimeEntry;
        
        setCurrentEntry(runningEntry);
        setIsRunning(true);
        setDescription(runningEntry.description);
      }
    } catch (err) {
      console.error("Error checking running timer:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadEntries = async () => {
    if (!user || !db) return;

    try {
      const q = query(
        collection(db, 'timer-sessions'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const loadedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeEntry[];

      setEntries(loadedEntries);
    } catch (err) {
      console.error("Error loading entries:", err);
    }
  };

  const filterEntries = () => {
    let filtered = entries;

    switch (dateFilter) {
      case 'today':
        filtered = entries.filter(entry => {
          const entryDate = entry.createdAt instanceof Timestamp 
            ? entry.createdAt.toDate() 
            : new Date(entry.createdAt);
          return isToday(entryDate);
        });
        break;
      case 'week':
        filtered = entries.filter(entry => {
          const entryDate = entry.createdAt instanceof Timestamp 
            ? entry.createdAt.toDate() 
            : new Date(entry.createdAt);
          return isThisWeek(entryDate, { weekStartsOn: 1 });
        });
        break;
      case 'month':
        filtered = entries.filter(entry => {
          const entryDate = entry.createdAt instanceof Timestamp 
            ? entry.createdAt.toDate() 
            : new Date(entry.createdAt);
          return isThisMonth(entryDate);
        });
        break;
      default:
        filtered = entries;
    }

    setFilteredEntries(filtered);
  };

  const calculateStats = () => {
    const today = entries
      .filter(e => {
        const entryDate = e.createdAt instanceof Timestamp ? e.createdAt.toDate() : new Date(e.createdAt);
        return isToday(entryDate);
      })
      .reduce((sum, e) => sum + e.duration, 0);

    const thisWeek = entries
      .filter(e => {
        const entryDate = e.createdAt instanceof Timestamp ? e.createdAt.toDate() : new Date(e.createdAt);
        return isThisWeek(entryDate, { weekStartsOn: 1 });
      })
      .reduce((sum, e) => sum + e.duration, 0);

    const thisMonth = entries
      .filter(e => {
        const entryDate = e.createdAt instanceof Timestamp ? e.createdAt.toDate() : new Date(e.createdAt);
        return isThisMonth(entryDate);
      })
      .reduce((sum, e) => sum + e.duration, 0);

    setStats({ today, thisWeek, thisMonth });
  };

  const handleStart = async () => {
    if (!user || !db || !description.trim()) {
      toast({
        title: 'Please add a description',
        variant: 'destructive'
      });
      return;
    }

    try {
      const newEntryData = {
        userId: user.id,
        userName: user.name,
        description: description.trim(),
        startTime: serverTimestamp(),
        duration: 0,
        status: 'running',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'timer-sessions'), newEntryData);
      
      setCurrentEntry({
        id: docRef.id,
        ...newEntryData,
        startTime: new Date()
      } as TimeEntry);
      
      setIsRunning(true);
      setElapsedTime(0);

      toast({ title: 'Timer started!' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleStop = async () => {
    if (!currentEntry || !db) return;

    try {
      const duration = elapsedTime;

      await updateDoc(doc(db, 'timer-sessions', currentEntry.id), {
        endTime: serverTimestamp(),
        duration,
        status: 'stopped'
      });

      setIsRunning(false);
      setCurrentEntry(null);
      setElapsedTime(0);
      setDescription('');

      toast({ title: `Timer stopped! Duration: ${formatDuration(duration)}` });
      
      loadEntries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const downloadReport = () => {
    const csvContent = [
      ['Date', 'Description', 'Start Time', 'End Time', 'Duration'],
      ...filteredEntries.map(entry => {
        const createdDate = entry.createdAt instanceof Timestamp ? entry.createdAt.toDate() : new Date(entry.createdAt);
        const startDate = entry.startTime instanceof Timestamp ? entry.startTime.toDate() : new Date(entry.startTime);
        const endDate = entry.endTime ? (entry.endTime instanceof Timestamp ? entry.endTime.toDate() : new Date(entry.endTime)) : null;
        
        return [
          format(createdDate, 'yyyy-MM-dd'),
          `"${entry.description.replace(/"/g, '""')}"`,
          format(startDate, 'HH:mm:ss'),
          endDate ? format(endDate, 'HH:mm:ss') : 'Running',
          formatDuration(entry.duration)
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({ title: 'Report downloaded!' });
  };

  const requiredHours = 8 * 3600; // 8 hours in seconds
  const todayProgress = (stats.today / requiredHours) * 100;

  if (isInitializing) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">⏱️ Time Tracker</h1>
          <p className="text-gray-400">Manage and monitor your working sessions</p>
        </div>
        <Button
          variant="outline"
          onClick={downloadReport}
          disabled={filteredEntries.length === 0}
          className="bg-[#13131F] border-white/10 hover:bg-white/5"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6 bg-[#13131F] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="h-16 w-16 text-primary" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1">Tracked Today</p>
            <p className="text-3xl font-bold text-white mb-4">{formatDuration(stats.today)}</p>
            <div className="space-y-2">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(todayProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span>{Math.min(Math.round(todayProgress), 100)}% of Goal</span>
                <span>8h Target</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#13131F] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="h-16 w-16 text-green-400" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1">This Week</p>
            <p className="text-3xl font-bold text-white">{formatDuration(stats.thisWeek)}</p>
            <p className="text-xs text-muted-foreground mt-4">Total productive hours this week</p>
          </div>
        </Card>

        <Card className="p-6 bg-[#13131F] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar className="h-16 w-16 text-blue-400" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1">This Month</p>
            <p className="text-3xl font-bold text-white">{formatDuration(stats.thisMonth)}</p>
            <p className="text-xs text-muted-foreground mt-4">Total productive hours this month</p>
          </div>
        </Card>
      </div>

      {/* Timer Card */}
      <Card className="p-10 bg-gradient-to-br from-[#13131F] to-[#0F0F1A] border-white/10 mb-8 shadow-2xl relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            <div className={cn("w-2 h-2 rounded-full", isRunning ? "bg-red-500 animate-pulse" : "bg-gray-500")} />
            {isRunning ? 'Recording active session' : 'Ready to start'}
          </div>

          <div className="text-7xl font-mono font-black text-white mb-8 tracking-tighter">
            {formatDuration(elapsedTime)}
          </div>

          <div className="max-w-md mx-auto mb-8">
            {!isRunning ? (
              <div className="space-y-3">
                <Label className="text-gray-400 text-xs uppercase font-bold tracking-widest">Description of your work</Label>
                <Input
                  placeholder="e.g., Motion Graphics for Niswarth Hospital"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-black/40 border-white/10 h-12 text-center"
                  onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                />
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-lg font-medium text-white">{description}</p>
                <p className="text-xs text-gray-500 mt-1">Session started at {currentEntry?.startTime ? format(currentEntry.startTime instanceof Timestamp ? currentEntry.startTime.toDate() : new Date(currentEntry.startTime), 'HH:mm') : '...'}</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {!isRunning ? (
              <Button
                size="lg"
                onClick={handleStart}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:scale-105 transition-transform px-12 h-14 rounded-2xl font-bold text-lg"
                disabled={!description.trim()}
              >
                <Play className="mr-3 h-6 w-6" />
                START TIMER
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleStop}
                className="bg-red-600 hover:bg-red-700 px-12 h-14 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-red-500/20"
              >
                <Square className="mr-3 h-5 w-5" />
                STOP SESSION
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Time Entries */}
      <Card className="p-6 bg-[#13131F] border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          </div>
          
          <div className="flex gap-1 bg-black/20 rounded-xl p-1 border border-white/5">
            {(['today', 'week', 'month', 'all'] as const).map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={dateFilter === filter ? 'default' : 'ghost'}
                onClick={() => setDateFilter(filter)}
                className={cn(
                  "capitalize rounded-lg h-8 px-4",
                  dateFilter === filter ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"
                )}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/5">
              <p className="text-gray-500">No time entries found for this period.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-purple-500/30 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-white font-semibold truncate">{entry.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(
                        entry.createdAt instanceof Timestamp ? entry.createdAt.toDate() : new Date(entry.createdAt),
                        'MMM dd, yyyy'
                      )}
                    </span>
                    <span className="opacity-30">•</span>
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(entry.startTime instanceof Timestamp ? entry.startTime.toDate() : new Date(entry.startTime), 'HH:mm')}
                      {entry.endTime && (
                        <> - {format(entry.endTime instanceof Timestamp ? entry.endTime.toDate() : new Date(entry.endTime), 'HH:mm')}</>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1 border-0",
                      entry.status === 'running'
                        ? 'bg-green-500/10 text-green-400 animate-pulse'
                        : 'bg-white/5 text-gray-400'
                    )}
                  >
                    {entry.status === 'running' ? 'Active' : formatDuration(entry.duration)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
