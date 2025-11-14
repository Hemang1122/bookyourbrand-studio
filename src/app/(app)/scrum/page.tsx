'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { format, isSameDay } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { ScrumExportDialog } from './components/scrum-export-dialog';
import { Calendar } from '@/components/ui/calendar';
import type { ScrumUpdate } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

type ReelUpdate = {
  id: string;
  reelName: string;
  duration: string;
  issues: string;
  remarks: string;
};

export default function ScrumPage() {
  const { user } = useAuth();
  const { users, scrumUpdates, addScrumUpdate } = useData();
  const { toast } = useToast();
  
  const [reelUpdates, setReelUpdates] = useState<ReelUpdate[]>([{ id: `reel-${Date.now()}`, reelName: '', duration: '', issues: '', remarks: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    const hasEmptyReelName = reelUpdates.some(update => !update.reelName.trim());
    if (hasEmptyReelName) {
      toast({ title: 'Error', description: 'Reel Name is required for all entries.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const newScrumUpdate: Omit<ScrumUpdate, 'id'> = {
      userId: user.id,
      timestamp: new Date().toISOString(),
      reels: reelUpdates,
      // Deprecated fields, kept for compatibility if needed.
      yesterday: '', 
      today: '',
    };
    
    addScrumUpdate(newScrumUpdate);
    
    setReelUpdates([{ id: `reel-${Date.now()}`, reelName: '', duration: '', issues: '', remarks: '' }]);
    toast({
      title: 'Update Submitted',
      description: 'Your daily scrum update has been recorded.',
    });
    setIsLoading(false);
  };
  
  const updatesForSelectedDate = scrumUpdates.filter(u => selectedDate && isSameDay(new Date(u.timestamp), selectedDate));

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Daily Scrum Sheet</h2>
            <p className="text-muted-foreground">
            Log your reel progress. Keep everyone in sync.
            </p>
        </div>

        {user?.role !== 'admin' && (
            <Card>
            <CardHeader>
                <CardTitle>My Daily Update</CardTitle>
                <CardDescription>Log the details for each reel you've worked on. Your update will be visible to the admin.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Reel Name</TableHead>
                          <TableHead>Reel duration (min:sec)</TableHead>
                          <TableHead>Issues (if any)</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reelUpdates.map((update) => (
                          <TableRow key={update.id}>
                            <TableCell>
                              <Input placeholder="e.g., Avhyay Monsoon Offer" value={update.reelName} onChange={(e) => handleInputChange(update.id, 'reelName', e.target.value)} disabled={isLoading} />
                            </TableCell>
                            <TableCell>
                              <Input placeholder="00:45" value={update.duration} onChange={(e) => handleInputChange(update.id, 'duration', e.target.value)} disabled={isLoading} />
                            </TableCell>
                            <TableCell>
                              <Input value={update.issues} onChange={(e) => handleInputChange(update.id, 'issues', e.target.value)} disabled={isLoading} />
                            </TableCell>
                            <TableCell>
                              <Input value={update.remarks} onChange={(e) => handleInputChange(update.id, 'remarks', e.target.value)} disabled={isLoading} />
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRow(update.id)} disabled={isLoading || reelUpdates.length <= 1}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleAddRow} disabled={isLoading}>
                      <Plus className="mr-2 h-4 w-4" /> Add Row
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit Update'}
                    </Button>
                  </div>
                </form>
            </CardContent>
            </Card>
        )}

        {user?.role === 'admin' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Date</CardTitle>
                            <CardDescription>Pick a day to review updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                             <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Updates for {selectedDate ? format(selectedDate, 'PPP') : '...'}</CardTitle>
                                    <CardDescription>Review the daily updates from your team.</CardDescription>
                                </div>
                                <ScrumExportDialog updates={scrumUpdates} users={users || []}>
                                    <Button variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export as PDF
                                    </Button>
                                </ScrumExportDialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                          {updatesForSelectedDate.length > 0 ? (
                            updatesForSelectedDate.map(update => {
                              const author = users.find(u => u.id === update.userId);
                              if (!author) return null;
                              return (
                                <div key={update.id} className="mb-8">
                                  <h4 className="font-semibold mb-2">{author.name}'s Update</h4>
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead>Reel Name</TableHead>
                                              <TableHead>Duration</TableHead>
                                              <TableHead>Issues</TableHead>
                                              <TableHead>Remarks</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {(update.reels && update.reels.length > 0) ? (
                                            update.reels.map((reel, index) => (
                                              <TableRow key={index}>
                                                  <TableCell>{reel.reelName}</TableCell>
                                                  <TableCell>{reel.duration}</TableCell>
                                                  <TableCell>{reel.issues}</TableCell>
                                                  <TableCell>{reel.remarks}</TableCell>
                                              </TableRow>
                                            ))
                                          ) : (
                                            // Fallback for old format
                                             <TableRow>
                                                <TableCell colSpan={4}>
                                                  <div className='text-sm text-muted-foreground'>
                                                    <p><b>Yesterday:</b> {update.yesterday}</p>
                                                    <p><b>Today:</b> {update.today}</p>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                          )}
                                      </TableBody>
                                  </Table>
                                </div>
                              )
                            })
                          ) : (
                             <div className="h-24 text-center flex items-center justify-center">
                                <p>No updates have been submitted for this day.</p>
                            </div>
                          )}
                        </CardContent>
                    </Card>
                </div>
             </div>
        )}
      </div>
    </div>
  );
}
