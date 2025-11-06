
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CameraOff } from 'lucide-react';

export function FaceRecognitionLogin() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      // Cleanup: stop camera stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleLogin = () => {
    setIsProcessing(true);
    toast({
      title: 'Scanning Face...',
      description: 'Please hold still.',
    });

    // Simulate face recognition processing
    setTimeout(() => {
      // In a real app, you would have logic to compare faces.
      // Here, we'll just simulate a successful login.
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      router.push('/dashboard');
      setIsProcessing(false);
    }, 2000);
  };
  
  const handleRegister = () => {
    setIsProcessing(true);
     toast({
      title: 'Registering Face',
      description: 'Capturing your biometric data. Please hold still.',
    });
    // Simulate registration processing
    setTimeout(() => {
       toast({
        title: 'Registration Successful',
        description: 'You can now log in using your face.',
      });
      setIsProcessing(false);
    }, 2000);
  };


  return (
    <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 text-center">
                    <CameraOff className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="font-semibold">Camera Access Denied</h3>
                    <p className="text-sm text-muted-foreground">Please enable camera access in your browser settings to use face recognition.</p>
                </div>
            )}
            {hasCameraPermission === null && (
                 <div className="absolute inset-0 flex items-center justify-center bg-background/90">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            )}
        </div>
      
      <div className="flex flex-col gap-2">
         <Button onClick={handleLogin} className="w-full" disabled={!hasCameraPermission || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Login with Face
        </Button>
        <Button onClick={handleRegister} variant="secondary" className="w-full" disabled={!hasCameraPermission || isProcessing}>
            Register Your Face
        </Button>
      </div>
    </div>
  );
}
