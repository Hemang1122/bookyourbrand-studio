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

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 lg:grid lg:grid-cols-2">
      <div className="absolute inset-0 bg-background animated-aurora"></div>

      <div className="relative hidden flex-col items-center justify-center text-center lg:flex">
        <LoginLogo className="text-5xl mb-4" />
        <p className="text-xl font-medium text-foreground">
          Your All-in-One Agency CRM.
        </p>
        <p className="text-muted-foreground">
          Manage projects, clients, and your team with ease.
        </p>
      </div>

      <div className="relative z-10 flex w-full max-w-sm items-center justify-center">
        <Card className="w-full bg-background/80 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center lg:hidden">
              <LoginLogo />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
            <CardDescription>
              Enter your credentials to sign in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
