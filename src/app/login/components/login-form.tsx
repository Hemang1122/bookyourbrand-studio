
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { users } from '@/lib/data';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = searchParams.get('from') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // This is mock authentication.
    // In a real app, you would validate against a database or auth service.
    setTimeout(() => {
        const user = users.find(u => u.email === email);
        // We're not checking the password for this mock.
        if(user) {
            // In a real app, you'd set a session cookie here.
            // For this mock, we'll use sessionStorage to persist the logged-in user's ID.
            sessionStorage.setItem('mockUserId', user.id);
            router.push(from);
        } else {
             setError('Invalid email or password. Please check your credentials.');
        }
        setIsLoading(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
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
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full button-pulse" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
      </Button>
    </form>
  );
}
