
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

function LoginPageContent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4 lg:grid lg:grid-cols-2">
      <div
        className="absolute inset-0 z-0 h-full w-full"
        style={{
          backgroundImage: `
          radial-gradient(ellipse at 25% 25%, hsl(var(--primary)/0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 75% 25%, hsl(var(--accent)/0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 25% 75%, hsl(50 100% 70% / 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 75% 75%, hsl(var(--primary)/0.3) 0%, transparent 50%)
        `,
          backgroundSize: '200% 200%',
          animation: 'aurora 15s ease infinite',
          filter: 'blur(20px)',
        }}
      >
        <style jsx>{`
          @keyframes aurora {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}</style>
      </div>


      <div className="relative z-10 hidden flex-col items-center justify-center text-center lg:flex">
        <h2 className="font-signature text-5xl mb-6 text-foreground/80 animate-fade-in-up">
            We get you notified
        </h2>
        <LoginLogo className="text-5xl mb-4" />
        <p className="text-xl font-medium text-foreground">
          Your All-in-One Agency CRM.
        </p>
        <p className="text-muted-foreground">
          Manage projects, clients, and your team with ease.
        </p>
      </div>

      <div className="relative z-10 flex w-full max-w-md items-center justify-center">
        <Card className="w-full bg-background/80 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center overflow-hidden">
            <div className="mb-4 flex justify-center lg:hidden">
              <LoginLogo />
            </div>
            <CardTitle className={`text-2xl font-bold transition-all duration-1000 ease-out ${isMounted ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>Welcome Back!</CardTitle>
            <CardDescription className={`transition-all duration-1000 ease-out delay-200 ${isMounted ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
              Sign in to your account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
      
      <div className="absolute bottom-4 z-10 text-center w-full text-muted-foreground">
        <div className="mb-4 flex justify-center gap-6">
            <a href="https://www.facebook.com/bookyourbrands/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
            <a href="https://www.instagram.com/bookyourbrands/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
            <a href="https://www.youtube.com/@Bookyourbrands" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Youtube className="h-5 w-5" /></a>
        </div>
        <p className="font-signature text-2xl">Arpit Lalani</p>
        <p className="text-sm tracking-wider">Founder and CEO</p>
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
