'use client';
import { Separator } from '@/components/ui/separator';
import { SettingsForm } from './components/settings-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BillingPage from './billing/page';
import { CreditCard, User, Share2 } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { SocialConnectCard } from './components/social-connect-card';


export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and billing.
        </p>
      </div>
      <Separator />
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${user.role === 'team' ? 'grid-cols-1' : (user.role === 'client' ? 'grid-cols-3' : 'grid-cols-2')}`}>
            <TabsTrigger value="profile"><User className="mr-2 h-4 w-4"/>Profile</TabsTrigger>
            {user.role !== 'team' && <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4"/>Billing</TabsTrigger>}
            {user.role === 'client' && <TabsTrigger value="social-connect"><Share2 className="mr-2 h-4 w-4"/>Social Connect</TabsTrigger>}
        </TabsList>
        <TabsContent value="profile">
            <SettingsForm />
        </TabsContent>
        {user.role !== 'team' && (
          <TabsContent value="billing">
              <BillingPage />
          </TabsContent>
        )}
        {user.role === 'client' && (
          <TabsContent value="social-connect">
              <SocialConnectCard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
