'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirebaseServices } from '@/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  Download, 
  Calendar,
  User,
  TrendingUp,
  Search,
  Users
} from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { type TimeEntry } from '@/lib/time-tracking-types';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserStats {
  userId: string;
  userName: string;
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalEntries: number;
}

export default function AdminTimeTrackingPage() {
  const { user } = useAuth();
  const { firestore: db } = useFirebaseServices();
  
  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Time entries
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  
  // Stats
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin' && db) {
      loadTeamMembers();
      loadAllTimeEntries();
    }
  }, [user, db]);

  useEffect(() => {
    applyFilters();
    calculateUserStats();
  }, [allEntries, selectedMember, dateFilter, searchQuery]);

  const loadTeamMembers = async () => {
    if (!db) return;
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', 'in', ['team', 'admin']))
    );
    
    const members = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TeamMember[];
    
    setTeamMembers(members);
  };

  const loadAllTimeEntries = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'timer-sessions'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeEntry[];

      setAllEntries(entries);
    } catch (error) {
      console.error('Error loading time entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allEntries];

    // Filter by user
    if (selectedMember !== 'all') {
      filtered = filtered.filter(entry => entry.userId === selectedMember);
    }

    // Filter by date
    filtered = filtered.filter(entry => {
      const entryDate = entry.createdAt instanceof Timestamp 
        ? entry.createdAt.toDate() 
        : new Date(entry.createdAt);

      switch (dateFilter) {
        case 'today':
          return isToday(entryDate);
        case 'week':
          return isThisWeek(entryDate, { weekStartsOn: 1 });
        case 'month':
          return isThisMonth(entryDate);
        default:
          return true;
      }
    });

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(entry => 
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.userName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  };

  const calculateUserStats = () => {
    const statsMap = new Map<string, UserStats>();

    allEntries.forEach(entry => {
      if (!statsMap.has(entry.userId)) {
        statsMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.userName,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          totalEntries: 0
        });
      }

      const stats = statsMap.get(entry.userId)!;
      const entryDate = entry.createdAt instanceof Timestamp 
        ? entry.createdAt.toDate() 
        : new Date(entry.createdAt);

      stats.totalEntries++;

      if (isToday(entryDate)) {
        stats.today += entry.duration;
      }
      if (isThisWeek(entryDate, { weekStartsOn: 1 })) {
        stats.thisWeek += entry.duration;
      }
      if (isThisMonth(entryDate)) {
        stats.thisMonth += entry.duration;
      }
    });

    setUserStats(Array.from(statsMap.values()).sort((a, b) => b.today - a.today));
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDetailedDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const downloadReport = () => {
    const csvContent = [
      ['Date', 'Team Member', 'Description', 'Start Time', 'End Time', 'Duration', 'Status'],
      ...filteredEntries.map(entry => {
        const createdDate = entry.createdAt instanceof Timestamp ? entry.createdAt.toDate() : new Date(entry.createdAt);
        const startDate = entry.startTime instanceof Timestamp ? entry.startTime.toDate() : new Date(entry.startTime);
        const endDate = entry.endTime ? (entry.endTime instanceof Timestamp ? entry.endTime.toDate() : new Date(entry.endTime)) : null;
        
        return [
          format(createdDate, 'yyyy-MM-dd'),
          entry.userName,
          `"${entry.description.replace(/"/g, '""')}"`,
          format(startDate, 'HH:mm:ss'),
          endDate ? format(endDate, 'HH:mm:ss') : 'Running',
          formatDetailedDuration(entry.duration),
          entry.status
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-time-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const totalDuration = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const requiredHours = 8 * 3600; // 8 hours in seconds

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Admin access only</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">👥 Team Time Tracking</h1>
          <p className="text-gray-400">Monitor team member work hours and productivity</p>
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

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-[#13131F] border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-white">{formatDuration(totalDuration)}</p>
              <p className="text-[10px] text-muted-foreground mt-1 capitalize">{dateFilter} period</p>
            </div>
            <Clock className="h-10 w-10 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-[#13131F] border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1">Total Entries</p>
              <p className="text-2xl font-bold text-white">{filteredEntries.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Logged sessions</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-400 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-[#13131F] border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1">Active Members</p>
              <p className="text-2xl font-bold text-white">{userStats.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Contributing team</p>
            </div>
            <User className="h-10 w-10 text-blue-400 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-[#13131F] border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1">Avg per Member</p>
              <p className="text-2xl font-bold text-white">
                {userStats.length > 0 ? formatDuration(Math.floor(totalDuration / userStats.length)) : '0h 0m'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Efficiency rate</p>
            </div>
            <Calendar className="h-10 w-10 text-purple-400 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Team Member Stats */}
      <Card className="p-6 bg-[#13131F] border-white/5 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-white">Team Member Summary</h2>
        </div>
        <div className="space-y-3">
          {userStats.map((stats) => {
            const todayProgress = (stats.today / requiredHours) * 100;
            
            return (
              <div
                key={stats.userId}
                className={cn(
                  "flex flex-col md:flex-row md:items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-purple-500/30 hover:bg-white/[0.04] transition-all cursor-pointer group",
                  selectedMember === stats.userId && "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                )}
                onClick={() => setSelectedMember(stats.userId)}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-white group-hover:text-primary transition-colors">{stats.userName}</p>
                    <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 font-semibold">
                      {stats.totalEntries} sessions
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Today: <strong className="text-white">{formatDuration(stats.today)}</strong></span>
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Week: <strong className="text-white">{formatDuration(stats.thisWeek)}</strong></span>
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Month: <strong className="text-white">{formatDuration(stats.thisMonth)}</strong></span>
                  </div>
                  <div className="mt-4 max-w-md">
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(todayProgress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span>{Math.min(Math.round(todayProgress), 100)}% of 8h Goal</span>
                      <span>Today's Effort</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="mt-4 md:mt-0 text-primary hover:text-primary hover:bg-primary/10">
                  View History
                </Button>
              </div>
            );
          })}

          {userStats.length === 0 && !isLoading && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-white/5">
              <p className="text-gray-500">No time entries recorded for this team yet.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6 bg-[#13131F] border-white/5 mb-6">
        <div className="flex flex-wrap gap-6">
          {/* Team Member Filter */}
          <div className="flex-1 min-w-[240px]">
            <Label className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-2 block">Filter by Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="All members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="flex-1 min-w-[240px]">
            <Label className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-2 block">Time Horizon</Label>
            <div className="flex gap-1 bg-black/20 rounded-xl p-1 border border-white/10">
              {(['today', 'week', 'month', 'all'] as const).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={dateFilter === filter ? 'default' : 'ghost'}
                  onClick={() => setDateFilter(filter)}
                  className={cn(
                    "capitalize flex-1 rounded-lg h-8 px-4",
                    dateFilter === filter ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"
                  )}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[240px]">
            <Label className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-2 block">Search Tasks</Label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search work description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-black/20 border-white/10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Time Entries Table */}
      <Card className="p-6 bg-[#13131F] border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Work Log ({filteredEntries.length})
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-white/5">
              <p className="text-gray-500">No matching entries found for the current selection.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-purple-500/30 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3 mb-1.5">
                    <p className="font-semibold text-white">{entry.userName}</p>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      {format(
                        entry.createdAt instanceof Timestamp ? entry.createdAt.toDate() : new Date(entry.createdAt),
                        'MMM dd, yyyy'
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-1">{entry.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500 font-mono">
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
                    className={cn(
                      "px-3 py-1 border-0",
                      entry.status === 'running'
                        ? 'bg-green-500/10 text-green-400 animate-pulse'
                        : 'bg-white/5 text-gray-400'
                    )}
                  >
                    {entry.status === 'running' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        Live
                      </div>
                    ) : (
                      formatDetailedDuration(entry.duration)
                    )}
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
