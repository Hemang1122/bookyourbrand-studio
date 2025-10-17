
'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoginLogo } from '@/components/login-logo';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) {
      toast({ title: 'Login Error', description: 'Email and password are required.', variant: 'destructive'});
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On successful login, the useUser hook will update,
      // and the useEffect below will handle the redirect.
    } catch (error: any) {
      let description = 'An unexpected error occurred during sign-in.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password. Please try again.';
      }
      toast({
        title: 'Login Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  // This effect handles the redirect after a successful login.
  // It waits until the user object is available and loading is complete.
  useEffect(() => {
    if (!isUserLoading && user) {
      redirect('/dashboard');
    }
  }, [user, isUserLoading]);


  // Show a loading state while checking auth, but not if the user is already logged in and just waiting for redirect.
  if (isUserLoading && !user) {
    return (
       <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
        <p>Loading...</p>
      </main>
    );
  }

  // If the user is already loaded, we don't need to show the login form, just wait for redirect.
  if (user) {
     return (
       <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
        <p>Signing in...</p>
      </main>
    );
  }


  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <LoginLogo />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>
            Enter your credentials to sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
