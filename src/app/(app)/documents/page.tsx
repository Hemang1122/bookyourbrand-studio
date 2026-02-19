'use client';

import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { redirect } from 'next/navigation';
import { FileText, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { ClientDocumentType, ClientDocument } from '@/lib/types';
import { format } from 'date-fns';

type RequiredDoc = {
    type: ClientDocumentType;
    name: string;
    description: string;
}

const requiredDocs: RequiredDoc[] = [
    { type: 'business_registration', name: 'Business Registration', description: 'Upload your proof of business registration.' },
    { type: 'founder_details', name: 'Founder Details', description: 'A document with details of the company founder(s).' },
];

const DocumentSlot = ({ docType, docName, description, existingDoc }: { docType: ClientDocumentType, docName: string, description: string, existingDoc?: ClientDocument }) => {
    const { user: client } = useAuth();
    const { addClientDocument } = useData();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !client) return;

        setIsUploading(true);
        try {
            await addClientDocument({
                clientId: client.id,
                name: docName,
                type: docType,
            }, file);
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };
    
    return (
         <div className="flex items-center justify-between rounded-lg border p-4 bg-background">
            <div className="flex items-center gap-4">
                {existingDoc ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                )}
                <div>
                    <p className="font-semibold">{docName}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                     {existingDoc && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Uploaded on {format(existingDoc.uploadedAt.toDate(), 'PP')}
                        </p>
                    )}
                </div>
            </div>
             <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {existingDoc ? 'Re-upload' : 'Upload'}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            </Button>
        </div>
    )
}

export default function DocumentsPage() {
    const { user } = useAuth();
    const { clientDocuments } = useData();

    const myDocs = useMemo(() => {
        if (!user) return [];
        return clientDocuments.filter(d => d.clientId === user.id);
    }, [clientDocuments, user]);

    if (!user || user.role !== 'client') {
        if (typeof window !== 'undefined') redirect('/dashboard');
        return null;
    }

    return (
        <div className="container mx-auto py-10">
            <div className="relative overflow-hidden rounded-2xl p-8 mb-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-purple-500 to-pink-500" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">My Documents</h1>
                    </div>
                    <p className="text-muted-foreground ml-14">
                        Please upload the required documents to complete your profile.
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                 {requiredDocs.map(reqDoc => {
                    const existingDoc = myDocs.find(d => d.type === reqDoc.type);
                    return <DocumentSlot key={reqDoc.type} {...reqDoc} existingDoc={existingDoc} />
                 })}
            </div>

        </div>
    )
}
