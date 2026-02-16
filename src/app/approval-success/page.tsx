'use client';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import { LoginLogo } from '@/components/login-logo';
import { Check } from 'lucide-react';

const Confetti = () => (
    <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 150 }).map((_, i) => {
            const style = {
                '--x': Math.random(),
                '--y': Math.random(),
                '--d': Math.random() * 10 + 5, // duration
                '--s': Math.random() * 0.4 + 0.6, // scale
                '--bg': `hsl(${Math.random() * 360}, 100%, 50%)`,
            } as React.CSSProperties;
            return <div key={i} className="confetti-piece" style={style}></div>;
        })}
        <style jsx>{`
            @keyframes fall {
                from {
                    transform: translateY(-10vh) translateX(calc(var(--x) * 100vw)) scale(var(--s));
                }
                to {
                    transform: translateY(110vh) translateX(calc(var(--x) * 100vw)) scale(var(--s));
                }
            }
            .confetti-piece {
                position: absolute;
                top: 0;
                left: 0;
                width: 8px;
                height: 16px;
                background: var(--bg);
                opacity: 0;
                animation: fall calc(var(--d) * 1s) linear calc(var(--y) * 10s) infinite;
            }
        `}</style>
    </div>
);

function SuccessMessage() {
    const searchParams = useSearchParams();
    const projectName = searchParams.get('project');

    return (
        <div style={{ background: 'linear-gradient(135deg, #0F0F1A, #1a0533)' }} className="min-h-screen flex flex-col items-center justify-center text-white p-4 overflow-hidden">
            <Confetti />
            <div className="absolute top-8 left-8">
                <LoginLogo />
            </div>
            <div className="relative text-center bg-[#13131F] border border-green-500/20 rounded-2xl p-8 md:p-12 shadow-2xl shadow-green-500/10 max-w-xl">
                <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-green-500/10 border-4 border-green-500/20 rounded-full animate-pulse">
                    <Check className="h-12 w-12 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold mb-3">🎉 Reel Approved!</h1>
                <p className="text-gray-400 text-lg">Thank you for approving the project: <strong className="text-green-400">{projectName || 'your reel'}</strong>.</p>
                <p className="text-sm text-gray-500 mt-4">
                    Our team has been notified. We will deliver your final files shortly.
                </p>
            </div>
        </div>
    );
}

export default function ApprovalSuccessPage() {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <SuccessMessage />
      </Suspense>
    );
}
