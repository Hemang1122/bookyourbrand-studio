
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { format, isSameDay } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Plus, Trash2, ClipboardList, Users, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { ScrumExportDialog } from './components/scrum-export-dialog';
import { Calendar } from '@/components/ui/calendar';
import type { ScrumUpdate as ScrumUpdateType } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


type ReelUpdate = {
  id: string;
  reelName: string;
  duration: string;
  issues: string;
  remarks: string;
};

// Component for a single scrum update card (for admin view)
const ScrumUpdateCard = ({ update, user, isExpanded, onToggleExpand }: { update: ScrumUpdateType, user: any, isExpanded: boolean, onToggleExpand: () => void }) => {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)' }}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-5 pb-4 cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #7C3AED, #EC4899)' }} />
            <Avatar className="h-9 w-9">
              <AvatarFallback style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))', color: '#E9D5FF' }}>
                {user?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-white">{user?.name}</h3>
              <p className="text-xs" style={{ color: '#6B7280' }}>Submitted at {format(new Date(update.timestamp), 'p')}</p>
            </div>
            <div className="ml-auto text-muted-foreground hover:text-white transition-transform">
              <ChevronDown className={cn("h-5 w-5 transition-transform", isExpanded && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
           <div className="p-5 space-y-5">
            {(update.yesterday || update.today) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {update.yesterday && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#F59E0B' }}>Yesterday</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{update.yesterday}</p>
                  </div>
                )}
                {update.today && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#10B981' }}>Today's Plan</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{update.today}</p>
                  </div>
                )}
              </div>
            )}

            {update.reels && update.reels.length > 0 && (
               <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="grid grid-cols-4 gap-4 px-4 py-3" style={{ background: 'rgba(124,58,237,0.1)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Reel Name', 'Duration', 'Issues', 'Remarks'].map(col => (
                    <span key={col} className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A78BFA' }}>{col}</span>
                  ))}
                </div>
                
                {update.reels.map((reel, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 items-center transition-colors hover:bg-white/[0.02]" style={{ borderBottom: i < update.reels.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span className="text-sm text-white font-medium">{reel.reelName}</span>
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>{reel.duration}</span>
                    <span className="text-sm" style={{ color: reel.issues && reel.issues.toLowerCase() !== 'no' && reel.issues !== '' ? '#EF4444' : '#6B7280' }}>{reel.issues || '—'}</span>
                    <span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: reel.remarks?.toLowerCase().includes('complete') ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: reel.remarks?.toLowerCase().includes('complete') ? '#10B981' : '#F59E0B' }}>
                        {reel.remarks || 'Pending'}
                      </span>
                    </span>
                  </div>
                ))}
                 <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{update.reels.length} reels submitted</span>
                  <span className="text-xs" style={{ color: '#10B981' }}>· {update.reels.filter(r => r.remarks?.toLowerCase().includes('complete')).length} completed</span>
                </div>
              </div>
            )}
           </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};


export default function ScrumPage() {
  const { user } = useAuth();
  const { users, scrumUpdates, addScrumUpdate } = useData();
  const { toast } = useToast();
  
  const [reelUpdates, setReelUpdates] = useState<ReelUpdate[]>([{ id: `reel-${Date.now()}`, reelName: '', duration: '', issues: '', remarks: '' }]);
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleAddRow = () => {
    setReelUpdates(prev => [...prev, { id: `reel-${Date.now()}`, reelName: '', duration: '', issues: '', remarks: '' }]);
  };

  const handleRemoveRow = (id: string) => {
    if (reelUpdates.length > 1) {
      setReelUpdates(prev => prev.filter(row => row.id !== id));
    }
  };

  const handleInputChange = (id: string, field: keyof Omit<ReelUpdate, 'id'>, value: string) => {
    setReelUpdates(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };
  
  const hasSubmittedToday = useMemo(() => {
    if (!user) return false;
    return scrumUpdates.some(update => isSameDay(new Date(update.timestamp), new Date()) && update.userId === user.id);
  }, [scrumUpdates, user]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    if (!yesterday.trim() || !today.trim()) {
        toast({ title: 'Error', description: 'Please fill out what you did yesterday and what you plan to do today.', variant: 'destructive' });
        return;
    }
    const hasReelEntry = reelUpdates.some(update => update.reelName.trim());
    if (hasReelEntry && reelUpdates.some(u => u.reelName.trim() === '')) {
      toast({ title: 'Error', description: 'Reel Name is required for all non-empty reel entries.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const newScrumUpdate: Omit<ScrumUpdateType, 'id' | 'timestamp'> = {
      userId: user.id,
      timestamp: new Date().toISOString(),
      reels: reelUpdates.filter(u => u.reelName.trim()),
      yesterday,
      today,
    };
    addScrumUpdate(newScrumUpdate);
    setReelUpdates([{ id: `reel-${Date.now()}`, reelName: '', duration: '', issues: '', remarks: '' }]);
    setYesterday('');
    setToday('');
    toast({
      title: 'Update Submitted',
      description: 'Your daily scrum update has been recorded.',
    });
    setIsLoading(false);
  };
  
  const updatesForSelectedDate = useMemo(() => {
     return scrumUpdates.filter(u => selectedDate && isSameDay(new Date(u.timestamp), selectedDate));
  }, [scrumUpdates, selectedDate]);
  
  const datesWithUpdates = useMemo(() => {
    return scrumUpdates.map(u => new Date(u.timestamp));
  }, [scrumUpdates]);

  const stats = useMemo(() => {
    const totalCompletedReels = updatesForSelectedDate.reduce((acc, update) => {
        return acc + (update.reels || []).filter(r => r.remarks?.toLowerCase().includes('complete')).length;
    }, 0);
    const totalIssues = updatesForSelectedDate.reduce((acc, update) => {
        return acc + (update.reels || []).filter(r => r.issues && r.issues.toLowerCase() !== 'no' && r.issues !== '').length;
    }, 0);

    return {
      updatesCount: updatesForSelectedDate.length,
      totalCompletedReels,
      totalIssues
    };
  }, [updatesForSelectedDate]);

  useEffect(() => {
    if (updatesForSelectedDate.length > 0) {
        setExpandedCards(new Set(updatesForSelectedDate.map(u => u.id)));
    } else {
        setExpandedCards(new Set());
    }
  }, [updatesForSelectedDate]);

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto py-10">
        <div className="relative overflow-hidden rounded-2xl p-8 mb-8" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(236,72,153,0.15) 100%)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Daily Scrum Sheet</h1>
              </div>
              <p className="text-muted-foreground ml-14">Track your team's daily progress and plans</p>
            </div>
            {user?.role === 'admin' && (
                <ScrumExportDialog updates={scrumUpdates} users={users || []}>
                    <Button style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }} className="text-white border-0 shadow-lg">
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                    </Button>
                </ScrumExportDialog>
            )}
          </div>
        </div>

        {user?.role !== 'admin' && (
             <Card style={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardHeader>
                <CardTitle className="text-white">My Daily Update for {format(new Date(), 'PPP')}</CardTitle>
                <CardDescription>Fill out your progress. Your update will be visible to the admin.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="yesterday" className="text-gray-300">What did you do yesterday?</Label>
                      <Textarea id="yesterday" value={yesterday} onChange={e => setYesterday(e.target.value)} placeholder="e.g., Completed editing for Project X, attended client meeting..." rows={4} disabled={isLoading || hasSubmittedToday} className="bg-black/20 border-white/10 text-white" />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="today" className="text-gray-300">What are you planning to do today?</Label>
                      <Textarea id="today" value={today} onChange={e => setToday(e.target.value)} placeholder="e.g., Start Project Y, follow up on feedback..." rows={4} disabled={isLoading || hasSubmittedToday} className="bg-black/20 border-white/10 text-white" />
                    </div>
                  </div>

                  <div>
                     <Label className="text-base font-medium text-white">Reel-Specific Updates (Optional)</Label>
                     <p className="text-sm text-muted-foreground mb-4">Add a row for each specific reel you worked on.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-white/10">
                          <TableHead className="min-w-[200px] text-gray-400">Reel Name</TableHead>
                          <TableHead className="text-gray-400">Reel duration (min:sec)</TableHead>
                          <TableHead className="text-gray-400">Issues (if any)</TableHead>
                          <TableHead className="text-gray-400">Remarks</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reelUpdates.map((update) => (
                          <TableRow key={update.id} className="border-b-0">
                            <TableCell><Input placeholder="e.g., Avhyay Monsoon Offer" value={update.reelName} onChange={(e) => handleInputChange(update.id, 'reelName', e.target.value)} disabled={isLoading || hasSubmittedToday} className="bg-black/20 border-white/10 text-white" /></TableCell>
                            <TableCell><Input placeholder="00:45" value={update.duration} onChange={(e) => handleInputChange(update.id, 'duration', e.target.value)} disabled={isLoading || hasSubmittedToday} className="bg-black/20 border-white/10 text-white" /></TableCell>
                            <TableCell><Input value={update.issues} onChange={(e) => handleInputChange(update.id, 'issues', e.target.value)} disabled={isLoading || hasSubmittedToday} className="bg-black/20 border-white/10 text-white" /></TableCell>
                            <TableCell><Input value={update.remarks} onChange={(e) => handleInputChange(update.id, 'remarks', e.target.value)} disabled={isLoading || hasSubmittedToday} className="bg-black/20 border-white/10 text-white" /></TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRow(update.id)} disabled={isLoading || reelUpdates.length <= 1 || hasSubmittedToday}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <Button type="button" variant="outline" onClick={handleAddRow} disabled={isLoading || hasSubmittedToday}>
                      <Plus className="mr-2 h-4 w-4" /> Add Row
                    </Button>
                    <Button type="submit" disabled={isLoading || hasSubmittedToday} size="lg" style={!hasSubmittedToday ? {background: 'linear-gradient(135deg, #7C3AED, #EC4899)'} : {}} className="text-white border-0 shadow-lg">
                        {isLoading ? 'Submitting...' : hasSubmittedToday ? 'Submitted Today ✓' : 'Submit Update'}
                    </Button>
                  </div>
                </form>
            </CardContent>
            </Card>
        )}
        
        {user?.role === 'admin' && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Updates Today', value: stats.updatesCount, color: '#7C3AED', icon: Users },
                    { label: 'Reels Completed', value: stats.totalCompletedReels, color: '#10B981', icon: CheckCircle },
                    { label: 'Pending Issues', value: stats.totalIssues, color: '#EF4444', icon: AlertCircle },
                ].map(stat => (
                    <div key={stat.label} className="rounded-xl p-4 flex items-center gap-4" style={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="p-2 rounded-lg" style={{ background: stat.color + '20' }}>
                        <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{stat.label}</p>
                    </div>
                    </div>
                ))}
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
                <div className="rounded-2xl p-6" style={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-white font-semibold mb-1">Select Date</h3>
                    <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>Pick a day to review updates</p>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        modifiers={{ hasUpdates: datesWithUpdates }}
                        modifiersClassNames={{
                            selected: 'day-selected-gradient',
                            today: 'day-today-border',
                            hasUpdates: 'day-has-updates'
                        }}
                        className="p-0"
                        classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption_label: "text-white font-bold",
                            nav_button: "hover:bg-white/10 text-white",
                            head_cell: "text-muted-foreground uppercase text-xs",
                            day: "hover:bg-primary/10 rounded-lg text-white",
                            day_outside: "text-white/30",
                        }}
                    />
                </div>
                <div>
                     <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Updates for {selectedDate ? format(selectedDate, 'PPP') : '...'}</h2>
                            <p style={{ color: '#9CA3AF' }} className="text-sm mt-1">{stats.updatesCount} team members submitted updates</p>
                        </div>
                        <div className="flex -space-x-2">
                            {updatesForSelectedDate.map(update => {
                                const author = users.find(u => u.id === update.userId);
                                return (
                                <Avatar key={update.id} className="h-8 w-8 border-2" style={{ borderColor: '#0F0F1A' }}>
                                    <AvatarFallback style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>{author?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                )
                            })}
                        </div>
                    </div>

                  {updatesForSelectedDate.length > 0 ? (
                    updatesForSelectedDate.map(update => {
                        const author = users.find(u => u.id === update.userId);
                        if (!author) return null;
                        return (
                            <ScrumUpdateCard
                                key={update.id}
                                update={update}
                                user={author}
                                isExpanded={expandedCards.has(update.id)}
                                onToggleExpand={() => toggleCard(update.id)}
                            />
                        )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl" style={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                            <ClipboardList className="h-8 w-8" style={{ color: '#7C3AED' }} />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">No updates for this date</h3>
                        <p style={{ color: '#6B7280' }} className="text-sm">Team members haven't submitted their scrum updates yet</p>
                    </div>
                  )}
                </div>
             </div>
        )}
    </div>
  );
}
