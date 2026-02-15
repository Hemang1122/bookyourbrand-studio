'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

export function DailyStandupCard() {
  return (
    <Card className="animate-fade-up stagger-5" style={{background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))', border: '1px solid rgba(124,58,237,0.2)'}}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <div className="p-1.5 rounded-lg bg-purple-500/20">
            <Video className="h-4 w-4 text-purple-400" />
          </div>
          Daily Standup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-white font-medium">10:00 AM Daily</p>
        </div>
        <p className="text-sm text-muted-foreground">
            Join the daily standup call to sync with your team.
        </p>
        <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 hover:opacity-90 transition-opacity">
            <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
            </a>
        </Button>
      </CardContent>
    </Card>
  );
}
