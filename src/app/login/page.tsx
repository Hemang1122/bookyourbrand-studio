
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

export default function LoginPage() {
  const admins = users.filter(u => u.role === 'admin');
  const team = users.filter(u => u.role === 'team');
  const clients = users.filter(u => u.role === 'client');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { auth, user } = useFirebase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const userToLogin = users.find(u => u.id === selectedUser);
    if (userToLogin && auth) {
      try {
        // We will use a hardcoded password for this prototype.
        await signInWithEmailAndPassword(auth, userToLogin.email, 'password');
        // Redirect is handled by the layout now
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Create the user if they don't exist in Firebase Auth
          try {
            await createUser(auth, userToLogin.email, 'password');
            // Try signing in again after creating
            await signInWithEmailAndPassword(auth, userToLogin.email, 'password');
          } catch(createUserError) {
             console.error("Error creating user:", createUserError);
          }
        } else {
            console.error("Error signing in:", error);
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
