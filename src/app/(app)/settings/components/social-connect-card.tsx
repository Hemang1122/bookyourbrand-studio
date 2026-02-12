
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
import { useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Instagram } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';

export function SocialConnectCard() {
  const { user } = useAuth();
  const { clients, isLoading } = useData();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const myClientRecord = useMemo(() => {
    if (!user || !clients) return null;
    return clients.find(c => c.id === user.id);
  }, [user, clients]);
  
  useEffect(() => {
    const instagramStatus = searchParams.get('instagram');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (instagramStatus === 'connected') {
        toast({
            title: 'Success!',
            description: 'Your Instagram account has been connected.',
        });
    } else if (error) {
        toast({
            title: `Connection Failed: ${error}`,
            description: errorDescription || 'An unknown error occurred during authentication.',
            variant: 'destructive',
        });
    }
  }, [searchParams, toast]);

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
     if (platform === 'instagram') {
      const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;
      
      // These details are from your Firebase project configuration.
      const projectId = 'studio-6449361728-f6242'; 
      const cloudFunctionRegion = 'us-central1';
      // This is the URL of the backend function we are about to create.
      const redirectUri = `https://${cloudFunctionRegion}-${projectId}.cloudfunctions.net/metaOAuthCallback`;
      
      const scope = 'pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish';
      const state = myClientRecord?.id; // Pass the client's ID to the backend.

      if (!state) {
        toast({
            title: "Error",
            description: "Could not identify your client account. Please try again.",
            variant: "destructive"
        });
        return;
      }
      
      if (!metaAppId || metaAppId === 'YOUR_META_APP_ID') {
         toast({
            title: "Configuration Needed",
            description: "The Meta App ID has not been configured yet. Please add it to the .env.local file.",
            variant: "destructive"
        });
        return;
      }

      const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`;

      // Redirect the user to the Meta login screen.
      window.location.href = oauthUrl;

    } else {
       toast({
        title: 'Coming Soon!',
        description: `Connecting to ${platform} is not yet implemented.`,
      });
    }
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
