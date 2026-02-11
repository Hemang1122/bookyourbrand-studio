'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../data-provider';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Instagram } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SocialConnectCard() {
  const { user } = useAuth();
  const { clients, isLoading } = useData();
  const { toast } = useToast();

  const myClientRecord = useMemo(() => {
    if (!user || !clients) return null;
    return clients.find(c => c.id === user.id);
  }, [user, clients]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Connections</CardTitle>
          <CardDescription>
            Connect your social media accounts to allow us to post on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 w-full bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }
  
  if (!myClientRecord) {
    return null;
  }

  const { social } = myClientRecord;

  const handleConnect = (platform: 'instagram' | 'facebook') => {
    toast({
      title: 'Coming Soon!',
      description: `Connecting to ${platform} is not yet implemented.`,
    });
  };

  const handleDisconnect = (platform: 'instagram' | 'facebook') => {
     toast({
      title: 'Coming Soon!',
      description: `Disconnecting from ${platform} is not yet implemented.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Connections</CardTitle>
        <CardDescription>
          Connect your social media accounts to enable automatic posting. Your credentials are stored securely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instagram Connection */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <Instagram className="h-8 w-8 text-pink-500" />
            <div>
              <h3 className="font-semibold">Instagram</h3>
              {social?.instagram?.connected ? (
                <p className="text-sm text-muted-foreground">Connected as: {social.instagram.pageName || 'Instagram Page'}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Not Connected</p>
              )}
            </div>
          </div>
          {social?.instagram?.connected ? (
            <Button variant="outline" onClick={() => handleDisconnect('instagram')}>Disconnect</Button>
          ) : (
            <Button onClick={() => handleConnect('instagram')}>Connect</Button>
          )}
        </div>

        {/* Facebook Connection */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <Facebook className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold">Facebook</h3>
               {social?.facebook?.connected ? (
                <p className="text-sm text-muted-foreground">Connected to: {social.facebook.pageName || 'Facebook Page'}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Not Connected</p>
              )}
            </div>
          </div>
           {social?.facebook?.connected ? (
            <Button variant="outline" onClick={() => handleDisconnect('facebook')}>Disconnect</Button>
          ) : (
            <Button onClick={() => handleConnect('facebook')}>Connect</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
