'use client';
import { Separator } from '@/components/ui/separator';
import { SettingsForm } from './components/settings-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Share2, Bell } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { SocialConnectCard } from './components/social-connect-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';


function NotificationSettings() {
  const [soundsEnabled, setSoundsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('soundsEnabled') !== 'false';
    }
    return true;
  });

  const toggleSounds = () => {
    const newValue = !soundsEnabled;
    setSoundsEnabled(newValue);
    localStorage.setItem('soundsEnabled', String(newValue));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Manage how you receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="sound-switch" className="text-base">
              Enable Notification Sounds
            </Label>
            <p className="text-sm text-muted-foreground">
              Play a sound for new messages and alerts.
            </p>
          </div>
          <Switch
            id="sound-switch"
            checked={soundsEnabled}
            onCheckedChange={toggleSounds}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;
  
  const TABS = [
    { value: 'profile', label: 'Profile', icon: User, roles: ['admin', 'team', 'client'] },
    { value: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'team', 'client'] },
    { value: 'social-connect', label: 'Social Connect', icon: Share2, roles: ['client'] },
  ];
  
  const visibleTabs = TABS.filter(tab => tab.roles.includes(user.role));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full grid-cols-${visibleTabs.length}`}>
            {visibleTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="mr-2 h-4 w-4"/>{tab.label}
              </TabsTrigger>
            ))}
        </TabsList>
        <TabsContent value="profile">
            <SettingsForm />
        </TabsContent>
         <TabsContent value="notifications">
            <NotificationSettings />
        </TabsContent>
        {user.role === 'client' && (
          <TabsContent value="social-connect">
              <SocialConnectCard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
