
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '@/app/(app)/data-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface TourStep {
  title: string;
  description: string;
  targetId?: string;
  position: 'center' | 'bottom' | 'right' | 'left' | 'top';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to BookYourBrands! 👋",
    description: "Let's take a quick tour to help you get started. It'll only take a minute.",
    position: 'center',
  },
  {
    title: "Your Command Center",
    description: "This is your Client Dashboard. Here you can see your active subscription, active projects, and delivery status at a glance.",
    targetId: 'dashboard-content',
    position: 'bottom',
  },
  {
    title: "Project Management",
    description: "This is where all your video projects live. Click on any project to view tasks, upload raw clips, and download your edited videos.",
    targetId: 'nav-projects',
    position: 'right',
  },
  {
    title: "File Organization",
    description: "Inside each project, use the Files tab to upload your raw video clips in organized folders. Your editor will deliver the final videos here too.",
    targetId: 'nav-projects',
    position: 'right',
  },
  {
    title: "Manage Your Plan",
    description: "View and manage your content package here. You can see how many reels you've used and upgrade your plan anytime.",
    targetId: 'nav-packages',
    position: 'right',
  },
  {
    title: "Direct Support",
    description: "Need help? Use the Support Chat to talk directly with the BookYourBrands team. We respond within 24 hours.",
    targetId: 'nav-support',
    position: 'right',
  },
  {
    title: "You're all set! 🎉",
    description: "You now know your way around. Let's create something amazing together!",
    position: 'center',
  }
];

export function OnboardingTour() {
  const { user } = useAuth();
  const { completeTour } = useData();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (user?.role === 'client' && !user.hasCompletedTour) {
      // Delay slightly to ensure elements are rendered
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    const step = TOUR_STEPS[currentStep];
    if (step.targetId && isVisible) {
      const element = document.getElementById(step.targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isVisible]);

  // Recalculate rect on window resize
  useEffect(() => {
    const handleResize = () => {
      const step = TOUR_STEPS[currentStep];
      if (step.targetId) {
        const element = document.getElementById(step.targetId);
        if (element) setTargetRect(element.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep]);

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
  };

  const handleSkip = async () => {
    setIsVisible(false);
    await completeTour();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const spotlightStyle: React.CSSProperties = targetRect ? {
    top: targetRect.top - 8,
    left: targetRect.left - 8,
    width: targetRect.width + 16,
    height: targetRect.height + 16,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8), 0 0 20px 2px rgba(124, 58, 237, 0.6)',
    borderRadius: '8px',
    position: 'fixed',
    zIndex: 9998,
    pointerEvents: 'none',
    transition: 'all 0.3s ease-out'
  } : {
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.8)',
    position: 'fixed',
    zIndex: 9998,
    pointerEvents: 'none',
  };

  const tooltipPosition: React.CSSProperties = (() => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    switch (step.position) {
      case 'bottom':
        return { top: targetRect.bottom + 20, left: targetRect.left + (targetRect.width / 2), transform: 'translateX(-50%)' };
      case 'right':
        return { top: targetRect.top + (targetRect.height / 2), left: targetRect.right + 20, transform: 'translateY(-50%)' };
      case 'left':
        return { top: targetRect.top + (targetRect.height / 2), left: targetRect.left - 340, transform: 'translateY(-50%)' };
      case 'top':
        return { top: targetRect.top - 200, left: targetRect.left + (targetRect.width / 2), transform: 'translateX(-50%)' };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  })();

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div style={spotlightStyle} />
      
      <div 
        style={tooltipPosition}
        className="absolute w-80 pointer-events-auto animate-in zoom-in-95 fade-in duration-300"
      >
        <Card className="bg-[#13131F] border-primary/30 shadow-2xl p-6 relative overflow-hidden">
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

            {isLast && <Sparkles className="h-8 w-8 text-yellow-400 mb-4 animate-bounce" />}
            
            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {step.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
              
              <div className="flex gap-2">
                {!isFirst && !isLast && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBack}
                    className="h-8 text-xs text-gray-400 hover:text-white"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" /> Back
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  onClick={handleNext}
                  className="h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-500 border-0"
                >
                  {isLast ? "Start Creating →" : "Next"}
                  {!isLast && <ChevronRight className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
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
    </div>,
    document.body
  );
}
