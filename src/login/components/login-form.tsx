'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useFirebaseServices } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useFirebaseServices();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = searchParams.get('from') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (!auth) {
      setError("Authentication service is not available. Please try again later.");
      setIsLoading(false);
      return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in the layout will handle the redirect.
      // We don't need to explicitly push here anymore, but we can to speed it up.
      router.push(from);
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please check your credentials.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          break;
      }
       setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 pt-4">
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
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute inset-y-0 right-0 h-full px-3"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
      </div>
      <Button type="submit" className="w-full button-pulse" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
      </Button>
    </form>
  );
}
