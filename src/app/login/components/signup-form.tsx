
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useFirebaseServices } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export function SignupForm() {
  const router = useRouter();
  const { auth } = useFirebaseServices();
  const { toast } = useToast();
  const [email, setEmail] = useState('akshaykothari@creative.co');
  const [password, setPassword] = useState('akshay@1234');
  const [name, setName] = useState('Akshay Kothari');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!auth) {
      setError("Authentication service is not available.");
      setIsLoading(false);
      return;
    }

    if (!name.trim()) {
      setError("Name is required.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Explicitly wait for the profile update to complete
      await updateProfile(userCredential.user, { displayName: name });
      
      // onAuthStateChanged in the main layout will handle creating the Firestore doc and redirecting.
      toast({
        title: 'Account Created',
        description: "You've been successfully signed up.",
      });

      // Now that profile is updated, we can safely redirect.
      router.push('/dashboard');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email address is already in use.');
          break;
        case 'auth/weak-password':
          setError('The password is too weak. Please use at least 6 characters.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          break;
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4 pt-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sign-up Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="name-signup">Full Name</Label>
        <Input
          id="name-signup"
          type="text"
          placeholder="e.g. Akshay Kothari"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-signup">Email</Label>
        <Input
          id="email-signup"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-signup">Password</Label>
        <Input
          id="password-signup"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full button-pulse" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
      </Button>
    </form>
  );
}

