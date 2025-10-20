
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
import { Suspense } from 'react';
import { FirebaseClientProvider } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignupForm } from './components/signup-form';

function LoginPageContent() {
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
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center lg:hidden">
              <LoginLogo />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
            <CardDescription>
              Sign in or create an account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                  <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                  </Suspense>
              </TabsContent>
              <TabsContent value="signup">
                   <Suspense fallback={<div>Loading...</div>}>
                    <SignupForm />
                  </Suspense>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
