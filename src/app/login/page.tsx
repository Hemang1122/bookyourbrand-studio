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
        // First, try to sign in.
        await signInWithEmailAndPassword(auth, userToLogin.email, 'password');
        // Redirect is handled by the layout now
      } catch (error: any) {
        // If sign-in fails (e.g., user not found or wrong password), try to create the user.
        // This is a robust way to handle users in this prototype environment.
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          try {
            await createUser(auth, userToLogin.email, 'password');
            // After creation, sign-in should succeed.
            await signInWithEmailAndPassword(auth, userToLogin.email, 'password');
          } catch (createUserError: any) {
             // If creating the user also fails (e.g., email already exists with a different credential),
             // it's a state we can't automatically recover from in this prototype.
             console.error("Failed to create or sign in user:", createUserError);
          }
        } else {
          // Handle other unexpected errors
          console.error("An unexpected error occurred during sign-in:", error);
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
