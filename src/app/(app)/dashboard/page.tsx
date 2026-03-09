
'use client';

import { AdminDashboard } from './components/admin-dashboard';
import { TeamDashboard } from './components/team-dashboard';
import { ClientDashboard } from './components/client-dashboard';
import { useAuth } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect } from 'react';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

const dashboardStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.3); }
    50% { box-shadow: 0 0 40px rgba(124,58,237,0.6); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  .animate-fade-up { 
    animation: fadeInUp 0.6s ease forwards; 
  }
  .animate-fade-left { 
    animation: fadeInLeft 0.6s ease forwards; 
  }
  .animate-fade-right { 
    animation: fadeInRight 0.6s ease forwards; 
  }
  .stagger-1 { animation-delay: 0.1s; opacity: 0; }
  .stagger-2 { animation-delay: 0.2s; opacity: 0; }
  .stagger-3 { animation-delay: 0.3s; opacity: 0; }
  .stagger-4 { animation-delay: 0.4s; opacity: 0; }
  .stagger-5 { animation-delay: 0.5s; opacity: 0; }
  .stagger-6 { animation-delay: 0.6s; opacity: 0; }
`;


export default function DashboardPage() {
  const { user } = useAuth();
  
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = dashboardStyles;
    document.head.appendChild(style);
    return () => {
        if (document.head.contains(style)) {
            document.head.removeChild(style);
        }
    };
  }, []);

  if (!user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center text-lg text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6" id="dashboard-container">
      <div className="relative overflow-hidden rounded-2xl p-8 mb-6 animate-fade-up stagger-1"
          style={{
          background: 'linear-gradient(135deg, #1a0533 0%, #0f0f1a 50%, #1a0a2e 100%)',
          border: '1px solid rgba(124,58,237,0.3)'
          }}>
        
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{
                background: 'radial-gradient(circle, #7C3AED, transparent)',
                animation: 'float 6s ease-in-out infinite'
            }} />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{
                background: 'radial-gradient(circle, #EC4899, transparent)',
                animation: 'float 8s ease-in-out infinite reverse'
            }} />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-purple-300 text-sm font-medium mb-1 flex items-center gap-2">
              <span>✦</span>
              {getGreeting()}
            </p>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #C084FC, #EC4899)',
                WebkitBackgroundClip: 'text',
                // @ts-ignore
                WebkitTextFillColor: 'transparent'
              }}>
                {user?.name}
              </span>
              {' '}👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening in your workspace today
            </p>
          </div>
          
          <div className="text-right hidden md:block">
            <p className="text-white font-medium">
              {format(new Date(), 'EEEE, MMMM do')}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {format(new Date(), 'yyyy')}
            </p>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-muted-foreground mb-0.5">
                Founded by
              </p>
              <p style={{
                fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                fontSize: '1.3rem',
                background: 'linear-gradient(135deg, #C084FC, #EC4899)',
                WebkitBackgroundClip: 'text',
                // @ts-ignore
                WebkitTextFillColor: 'transparent',
                fontWeight: '600'
              }}>
                Preeti Lalani
              </p>
              <p className="text-xs text-purple-400/70 mt-0.5">
                CEO & Founder, BookYourBrands
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div id="dashboard-content" data-tour="dashboard-content">
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'team' && <TeamDashboard />}
        {user.role === 'client' && <ClientDashboard />}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 text-center md:hidden">
        <p className="text-xs text-muted-foreground mb-1">
          Founded by
        </p>
        <p style={{
          fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
          fontSize: '1.4rem',
          background: 'linear-gradient(135deg, #C084FC, #EC4899)',
          WebkitBackgroundClip: 'text',
          // @ts-ignore
          WebkitTextFillColor: 'transparent',
        }}>
          Preeti Lalani
        </p>
        <p className="text-xs text-purple-400/70 mt-0.5">
          CEO & Founder, BookYourBrands
        </p>
      </div>
    </div>
  );
}
