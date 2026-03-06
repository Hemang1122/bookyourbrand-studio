'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoginLogo } from '@/components/login-logo';
import { LoginForm } from './components/login-form';
import { Suspense, useEffect, useState } from 'react';
import { FirebaseClientProvider } from '@/firebase';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function LoginPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If auth is loaded and user exists, redirect them to the dashboard.
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  // If auth state is loading, show a spinner.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If auth is loaded and no user, show the login page.
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0F0F1A] p-4 lg:grid lg:grid-cols-2">
      {/* Aurora Background Effect */}
      <div
        className="absolute inset-0 z-0 h-full w-full"
        style={{
          backgroundImage: `
          radial-gradient(ellipse at 25% 25%, hsl(var(--primary)/0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 75% 25%, hsl(var(--accent)/0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(124, 58, 237, 0.05) 0%, transparent 70%)
        `,
          backgroundSize: '200% 200%',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 hidden flex-col items-center justify-center text-center lg:flex p-12">
        <div className="animate-fade-in-up">
          <h2 className="font-signature text-6xl mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            We get you noticed
          </h2>
          <LoginLogo className="mb-6 scale-110" />
          <p className="text-2xl font-medium text-white/90 mt-4">
            The Creative Intelligence Hub.
          </p>
          <p className="text-gray-400 max-w-md mx-auto mt-2">
            Your high-performance workspace for elite video production and brand growth.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-md items-center justify-center px-4">
        <Card className="w-full bg-[#13131F]/60 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-500" />
          <CardHeader className="text-center space-y-2 pt-10">
            <div className="mb-6 flex justify-center lg:hidden">
              <LoginLogo />
            </div>
            <CardTitle className={`text-3xl font-black text-white tracking-tight transition-all duration-1000 ease-out ${isMounted ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
                Welcome Back
            </CardTitle>
            <CardDescription className={`text-gray-400 transition-all duration-1000 ease-out delay-200 ${isMounted ? 'translate-y-0 opacity-100' : '-translate-y-5 opacity-0'}`}>
              Access your brand management console
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10">
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>}>
                <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
      
      <div className="absolute bottom-8 z-10 text-center w-full">
        <div className="mb-6 flex justify-center gap-8">
            <a href="https://www.facebook.com/bookyourbrands/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors duration-300"><Facebook className="h-5 w-5" /></a>
            <a href="https://www.instagram.com/bookyourbrands/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors duration-300"><Instagram className="h-5 w-5" /></a>
            <a href="https://www.youtube.com/@Bookyourbrands" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors duration-300"><Youtube className="h-5 w-5" /></a>
        </div>
        <p className="font-signature text-3xl text-white/80 mb-1">Preeti Lalani</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold">Founder and CEO | BookYourBrands</p>
      </div>
    </main>
  );
}


export default function LoginPage() {
    return (
        <FirebaseClientProvider>
            <LoginPageContent />
        </FirebaseClientProvider>
    )
}
