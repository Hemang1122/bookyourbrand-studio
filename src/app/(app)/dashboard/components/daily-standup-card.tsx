'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DailyStandupCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Daily Standup Meeting</CardTitle>
        <Video className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">10:00 AM Daily</div>
        <p className="text-xs text-muted-foreground">
          Join the daily sync-up call.
        </p>
        <Button asChild className="w-full">
            <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer">
                Join Meeting
            </a>
        </Button>
      </CardContent>
    </Card>
  );
}
