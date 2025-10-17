'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoginLogo } from '@/components/login-logo';
import { users } from '@/lib/data';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { redirect } from 'next/navigation';
import {
  createUserWithEmailAndPassword as createUser,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const admins = users.filter(u => u.role === 'admin');
  const team = users.filter(u => u.role === 'team');
  const clients = users.filter(u => u.role === 'client');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { auth, user } = useFirebase();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const userToLogin = users.find(u => u.id === selectedUser);
    if (userToLogin && auth) {
      try {
        // First, try to create the user. If they already exist, this will fail.
        await createUser(auth, userToLogin.email, 'password');
        // If creation is successful, the user is automatically signed in.
        // The onAuthStateChanged listener in the layout will handle the redirect.
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          // If the user already exists, we sign them in.
          try {
            await signInWithEmailAndPassword(auth, userToLogin.email, 'password');
          } catch (signInError: any) {
             toast({
              title: 'Login Failed',
              description: `An unexpected error occurred during sign-in: ${signInError.message}`,
              variant: 'destructive',
            });
          }
        } else {
          // For any other creation error, show a toast.
          toast({
            title: 'Login Error',
            description: `Could not create or sign in user: ${error.message}`,
            variant: 'destructive',
          });
        }
      }
    }
  };


  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <LoginLogo />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
          <CardDescription>
            Select a user to sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">Select User</Label>
              <Select name="user_id" required onValueChange={setSelectedUser} value={selectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to log in as" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Admins</SelectLabel>
                    {admins.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectGroup>
                   <SelectGroup>
                    <SelectLabel>Team</SelectLabel>
                    {team.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectGroup>
                   <SelectGroup>
                    <SelectLabel>Clients</SelectLabel>
                    {clients.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
