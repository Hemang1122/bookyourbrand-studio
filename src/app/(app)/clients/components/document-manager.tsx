'use client';

import { useState, useMemo, useRef } from 'react';
import type { Client, ClientDocument } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { useData } from '../../data-provider';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const DocumentRow = ({ doc, onDelete }: { doc: ClientDocument, onDelete: (doc: ClientDocument) => void }) => {
    return (
        <div className="flex items-center justify-between rounded-lg border p-3 bg-background">
            <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {doc.fileName} · {format(doc.uploadedAt.toDate(), 'PP')}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                    </a>
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the document "{doc.fileName}". This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(doc)} className="bg-destructive hover:bg-destructive/90">Delete Document</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

const DocumentUploadSlot = ({ client, docType, docName }: { client: Client, docType: 'contract' | 'package_details', docName: string }) => {
    const { addClientDocument } = useData();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
        <div className="flex items-center justify-between rounded-lg border p-3 bg-background">
            <p className="font-medium text-sm">{docName}</p>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            </Button>
        </div>
    );
};


export function DocumentManager({ client }: { client: Client }) {
    const { clientDocuments, deleteClientDocument } = useData();

    const { adminDocs, clientDocs } = useMemo(() => {
        const docs = clientDocuments.filter(d => d.clientId === client.id);
        return {
            adminDocs: docs.filter(d => d.type === 'contract' || d.type === 'package_details'),
            clientDocs: docs.filter(d => d.type === 'business_registration' || d.type === 'founder_details' || d.type === 'custom'),
        };
    }, [clientDocuments, client.id]);

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <h4 className="font-semibold text-base">Admin Documents</h4>
                <div className="space-y-2">
                    <DocumentUploadSlot client={client} docType="contract" docName="Contract" />
                    <DocumentUploadSlot client={client} docType="package_details" docName="Package Details" />
                </div>
                 {adminDocs.length > 0 && (
                    <div className="space-y-2 pt-2">
                        {adminDocs.map(doc => <DocumentRow key={doc.id} doc={doc} onDelete={deleteClientDocument} />)}
                    </div>
                )}
            </div>
            <div className="space-y-3">
                <h4 className="font-semibold text-base">Client Documents</h4>
                <div className="space-y-2">
                    {clientDocs.length > 0 ? (
                        clientDocs.map(doc => <DocumentRow key={doc.id} doc={doc} onDelete={deleteClientDocument} />)
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded by the client yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
