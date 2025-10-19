
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';
import type { ScrumUpdate } from '@/lib/types';
import { useData } from '../data-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format, isToday } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { ScrumExportDialog } from './components/scrum-export-dialog';

export default function ScrumPage() {
  const { user } = useAuth();
  const { users, scrumUpdates, addScrumUpdate } = useData();
  const { toast } = useToast();
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !yesterday || !today) {
      toast({
        title: 'Error',
        description: 'Please fill out both fields.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      addScrumUpdate({
        userId: user.id,
        yesterday,
        today,
        timestamp: new Date().toISOString(),
      });
      setYesterday('');
      setToday('');
      toast({
        title: 'Update Submitted',
        description: 'Your daily update has been recorded.',
      });
      setIsLoading(false);
    }, 500);
  };
  
  const updatesForToday = scrumUpdates.filter(u => isToday(new Date(u.timestamp)));

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Daily Scrum Sheet</h2>
            <p className="text-muted-foreground">
            Log your progress. Keep everyone in sync.
            </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Daily Update</CardTitle>
            <CardDescription>What are your goals for today and what did you accomplish yesterday? Your update will be visible to the admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="yesterday" className="text-base font-medium">What did you accomplish yesterday?</Label>
                <Textarea
                  id="yesterday"
                  value={yesterday}
                  onChange={(e) => setYesterday(e.target.value)}
                  placeholder="e.g., - Completed the final draft of the campaign visuals. - Attended the client sync call and took notes."
                  rows={4}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="today" className="text-base font-medium">What are your goals for today? (Include any questions or blockers)</Label>
                <Textarea
                  id="today"
                  value={today}
                  onChange={(e) => setToday(e.target.value)}
                  placeholder="e.g., - Start developing the content calendar for Project X. - I have a question about the new brand guidelines."
                  rows={4}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Update'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {user?.role === 'admin' && (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Team & Client Updates for Today</CardTitle>
                            <CardDescription>Review the daily updates from your team and clients.</CardDescription>
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
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[15%]">Team Member / Client</TableHead>
                                <TableHead className="w-[35%]">Yesterday's Accomplishments</TableHead>
                                <TableHead className="w-[35%]">Today's Goals / Questions</TableHead>
                                <TableHead className="w-[15%] text-right">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {updatesForToday.length > 0 ? (
                                updatesForToday.map(update => {
                                    const author = users.find(u => u.id === update.userId);
                                    const avatar = PlaceHolderImages.find(img => img.id === author?.avatar);
                                    if (!author) return null;

                                    return (
                                        <TableRow key={update.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={avatar?.imageUrl} alt={author.name} data-ai-hint={avatar?.imageHint}/>
                                                        <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{author.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-pre-line text-muted-foreground">{update.yesterday}</TableCell>
                                            <TableCell className="whitespace-pre-line text-muted-foreground">{update.today}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {format(new Date(update.timestamp), 'p')}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                 <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No updates have been submitted yet today.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
