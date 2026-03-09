'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useData } from '@/app/(app)/data-provider';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

type TourStep = {
  id: string;
  title: string;
  description: string;
  path?: string;
  elementSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
};

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BookYourBrands! 👋',
    description: "Let's take a quick tour to help you get started. It'll only take a minute.",
    path: '/dashboard',
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Your Command Center',
    description: 'This is your Client Dashboard. Here you can see your active subscription, active projects, and delivery status at a glance.',
    path: '/dashboard',
    elementSelector: '[data-tour="dashboard-content"]',
    position: 'bottom',
  },
  {
    id: 'projects',
    title: 'Project Management',
    description: 'This is where all your video projects live. Click on any project to view tasks, upload raw clips, and download your edited videos.',
    path: '/projects',
    elementSelector: '#nav-projects',
    position: 'right',
  },
  {
    id: 'files',
    title: 'File Management',
    description: 'Inside each project, use the Files tab to upload your raw video clips in organized folders. Your editor will deliver the final videos here too.',
    path: '/projects',
    elementSelector: '[data-tour="files-tab"]',
    position: 'bottom',
  },
  {
    id: 'packages',
    title: 'Manage Your Plan',
    description: "View and manage your content package here. You can see how many reels you've used and upgrade your plan anytime.",
    path: '/packages',
    elementSelector: '#nav-packages',
    position: 'right',
  },
  {
    id: 'support',
    title: 'Direct Support',
    description: 'Need help? Use the Support Chat to talk directly with the BookYourBrands team. We respond within 24 hours.',
    path: '/dashboard',
    elementSelector: '#nav-support',
    position: 'right',
  },
  {
    id: 'complete',
    title: "You're all set! 🎉",
    description: "You now know your way around. Let's create something amazing together!",
    path: '/dashboard',
    position: 'center',
  },
];

export function OnboardingTour() {
  const { user } = useAuth();
  const { completeTour } = useData();
  const router = useRouter();
  const pathname = usePathname();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const resizeTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only trigger for clients who haven't finished the tour
    if (user?.role === 'client' && !user?.hasCompletedTour) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const updateTargetRect = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    if (step.elementSelector) {
      const element = document.querySelector(step.elementSelector);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    
    if (step.path && pathname !== step.path) {
      router.push(step.path);
    }

    // Delay slightly to allow for DOM updates and navigation
    const timer = setTimeout(updateTargetRect, 600);
    return () => clearTimeout(timer);
  }, [currentStep, isVisible, pathname, router, updateTargetRect]);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(updateTargetRect, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateTargetRect, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsVisible(false);
    await completeTour();
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7C3AED', '#EC4899', '#ffffff'],
      zIndex: 10001
    });
  };

  const handleSkip = async () => {
    setIsVisible(false);
    await completeTour();
  };

  if (!isVisible || !user) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const spotlightStyle: React.CSSProperties = targetRect ? {
    top: targetRect.top - 8,
    left: targetRect.left - 8,
    width: targetRect.width + 16,
    height: targetRect.height + 16,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 40px 10px rgba(124, 58, 237, 0.4)',
    borderRadius: '16px',
    position: 'fixed',
    zIndex: 9998,
    pointerEvents: 'none',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '2px solid rgba(168, 85, 247, 0.5)'
  } : {
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.6)',
    position: 'fixed',
    zIndex: 9998,
    pointerEvents: 'none',
    backdropFilter: 'blur(2px)'
  };

  const tooltipPosition: React.CSSProperties = (() => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 30;
    
    switch (step.position) {
      case 'bottom':
        return { top: targetRect.bottom + padding, left: targetRect.left + (targetRect.width / 2), transform: 'translateX(-50%)' };
      case 'right':
        return { top: targetRect.top + (targetRect.height / 2), left: targetRect.right + padding, transform: 'translateY(-50%)' };
      case 'left':
        return { top: targetRect.top + (targetRect.height / 2), left: targetRect.left - 360, transform: 'translateY(-50%)' };
      case 'top':
        return { top: targetRect.top - 250, left: targetRect.left + (targetRect.width / 2), transform: 'translateX(-50%)' };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  })();

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div style={spotlightStyle} className="transition-all duration-400" />
      
      <div 
        style={tooltipPosition}
        className="absolute w-[340px] pointer-events-auto animate-in zoom-in-95 fade-in duration-300"
      >
        <div className="bg-[#13131F] border-2 border-primary/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {isLast && (
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
              <div className="absolute top-[-50px] left-[-50px] w-full h-full bg-gradient-to-br from-primary to-pink-500 rounded-full blur-3xl animate-pulse" />
            </div>
          )}
          
          <div className="relative z-10">
            <button 
              onClick={handleSkip}
              className="absolute -top-2 -right-2 p-2 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {(isFirst || isLast) && (
              <div className="mb-4 flex justify-center">
                <Sparkles className="h-10 w-10 text-purple-400 animate-pulse" />
              </div>
            )}
            
            <h3 className="text-xl font-bold text-white mb-2 leading-tight">{step.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              {step.description}
            </p>

            <div className="space-y-4">
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-500 h-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Step {currentStep + 1} / {TOUR_STEPS.length}
                </span>
                
                <div className="flex gap-2">
                  {!isFirst && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleBack}
                      className="h-8 text-xs text-gray-400 hover:text-white"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" /> Back
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    onClick={handleNext}
                    className="h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-500 border-0 shadow-lg hover:shadow-purple-500/20"
                  >
                    {isLast ? "Start Creating →" : "Next Step"}
                    {!isLast && <ArrowRight className="h-3 w-3 ml-1" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {!isLast && (
          <Button 
            variant="link" 
            size="sm" 
            onClick={handleSkip}
            className="w-full mt-4 text-gray-500 hover:text-white text-[10px] uppercase tracking-widest font-bold"
          >
            Skip Tour
          </Button>
        )}
      </div>
    </div>
  );
}
