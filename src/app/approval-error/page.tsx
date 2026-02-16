'use client';
import { LoginLogo } from '@/components/login-logo';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ApprovalErrorPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reason = searchParams.get('reason');

    const messages = {
        missing_params: 'The approval link is incomplete. Please check the link and try again.',
        not_found: 'The project associated with this link could not be found.',
        invalid_token: 'This approval link is invalid or has already been used.',
        invalid_action: 'The action specified in the link is not recognized.',
        server_error: 'An unexpected error occurred. Our team has been notified.',
        default: 'This approval link is invalid or has expired.'
    };

    const errorMessage = messages[reason as keyof typeof messages] || messages.default;

    return (
        <div style={{ background: 'linear-gradient(135deg, #0F0F1A, #1a0533)' }} className="min-h-screen flex flex-col items-center justify-center text-white p-4">
             <div className="absolute top-8 left-8">
                <LoginLogo />
            </div>
            <div className="text-center bg-[#13131F] border border-red-500/20 rounded-2xl p-8 md:p-12 shadow-2xl shadow-red-500/10 max-w-xl">
                <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-red-500/10 border-4 border-red-500/20 rounded-full">
                    <AlertTriangle className="h-12 w-12 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold mb-3">Approval Link Error</h1>
                <p className="text-gray-400 text-lg mb-8">{errorMessage}</p>
                <p className="text-sm text-gray-500">
                    If you believe this is a mistake, please contact our support team directly or reply to the original email.
                </p>
                 <Button onClick={() => router.push('/')} className="mt-8 bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
                    Return to Homepage
                </Button>
            </div>
        </div>
    );
}
