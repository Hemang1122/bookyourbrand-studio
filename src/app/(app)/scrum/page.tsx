
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
import { format } from 'date-fns';

export default function ScrumPage() {
  const { user } = useAuth();
  const { users } = useData();
  const { toast } = useToast();
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [updates, setUpdates] = useState<ScrumUpdate[]>([]);
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
      const newUpdate: ScrumUpdate = {
        id: `scrum-${Date.now()}`,
        userId: user.id,
        yesterday,
        today,
        timestamp: new Date().toISOString(),
      };
      setUpdates(prev => [newUpdate, ...prev]);
      setYesterday('');
      setToday('');
      toast({
        title: 'Update Submitted',
        description: 'Your daily scrum update has been recorded.',
      });
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Daily Scrum Sheet</h2>
            <p className="text-muted-foreground">
            Log your progress. Keep the team in sync.
            </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Daily Update</CardTitle>
            <CardDescription>What are your goals for today and what did you accomplish yesterday?</CardDescription>
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
                <Label htmlFor="today" className="text-base font-medium">What are your goals for today?</Label>
                <Textarea
                  id="today"
                  value={today}
                  onChange={(e) => setToday(e.target.value)}
                  placeholder="e.g., - Start developing the content calendar for Project X. - Review and provide feedback on the new logo sketches."
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

        <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight">Team Updates</h3>
            {updates.length > 0 ? (
                <div className="space-y-4">
                    {updates.map(update => {
                        const author = users.find(u => u.id === update.userId);
                        const avatar = PlaceHolderImages.find(img => img.id === author?.avatar);
                        if (!author) return null;

                        return (
                            <Card key={update.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                             <Avatar>
                                                <AvatarImage src={avatar?.imageUrl} alt={author.name} data-ai-hint={avatar?.imageHint}/>
                                                <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">{author.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground">{format(new Date(update.timestamp), 'PPP p')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <div>
                                        <h4 className="font-semibold mb-2">Yesterday's Accomplishments</h4>
                                        <p className="text-muted-foreground whitespace-pre-line">{update.yesterday}</p>
                                     </div>
                                      <div>
                                        <h4 className="font-semibold mb-2">Today's Goals</h4>
                                        <p className="text-muted-foreground whitespace-pre-line">{update.today}</p>
                                     </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">No scrum updates have been submitted yet today.</p>
            )}
        </div>
      </div>
    </div>
  );
}
