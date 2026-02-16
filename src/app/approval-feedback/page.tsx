'use client';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { LoginLogo } from '@/components/login-logo';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function FeedbackForm() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');
    const token = searchParams.get('token');
    const projectName = searchParams.get('project');

    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.trim()) {
            setError('Please provide your feedback before submitting.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/project-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, token, feedback }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit feedback.');
            }
            
            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ background: 'linear-gradient(135deg, #0F0F1A, #1a0533)' }} className="min-h-screen flex flex-col items-center justify-center text-white p-4">
            <div className="absolute top-8 left-8">
                <LoginLogo />
            </div>

            <Card className="w-full max-w-2xl bg-[#13131F] border border-white/5 rounded-2xl shadow-2xl shadow-purple-500/10">
                 {isSubmitted ? (
                    <CardContent className="p-8 md:p-12 text-center">
                        <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-green-500/10 border-4 border-green-500/20 rounded-full">
                           <CheckCircle className="h-12 w-12 text-green-400" />
                        </div>
                        <h1 className="text-3xl font-bold mb-3 text-white">Feedback Sent!</h1>
                        <p className="text-gray-400 text-lg">Thank you for your input. Our team has been notified and will review your requested changes.</p>
                        <p className="text-sm text-gray-500 mt-4">We'll get back to you within 24 hours.</p>
                    </CardContent>
                ) : (
                    <>
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-bold">Request Changes</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">
                                for project: <span className="font-semibold text-purple-400">{projectName || '...'}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Please describe in detail what changes you would like our team to make..."
                                    rows={8}
                                    className="bg-black/20 border-white/10 text-base"
                                    required
                                />
                                {error && <p className="text-sm text-red-400">{error}</p>}
                                <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 text-base" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
                                    Submit Feedback
                                </Button>
                            </form>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}


export default function ApprovalFeedbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FeedbackForm />
        </Suspense>
    );
}

