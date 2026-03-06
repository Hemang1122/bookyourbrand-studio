'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { useFirebaseServices } from '@/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, addDoc, query, orderBy } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { REQUIRED_DOCUMENTS, type ClientDocument } from '@/lib/document-types';

export default function AdminDocumentsPage() {
  const { user } = useAuth();
  const { firestore, areServicesAvailable } = useFirebaseServices();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [rejectionReason, setRejectionReason] = useState<{[key: string]: string}>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin' && firestore) {
      loadDocuments();
    }
  }, [user, firestore]);

  const loadDocuments = async () => {
    if (!firestore) return;
    try {
      const snapshot = await getDocs(collection(firestore, 'clientDocuments'));
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ClientDocument[];
      setDocuments(docs.sort((a, b) => 
        a.status === 'pending' ? -1 : 1
      ));
    } catch (error) {
      console.error('Error loading docs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (docId: string, clientId: string) => {
    if (!firestore || !user) return;
    setProcessing(docId);
    try {
      await updateDoc(doc(firestore, 'clientDocuments', docId), {
        status: 'approved',
        reviewedBy: user.id,
        reviewedAt: serverTimestamp()
      });

      // Notify client
      await addDoc(collection(firestore, 'notifications'), {
        message: 'Your document has been approved',
        type: 'system',
        url: '/documents',
        recipients: [clientId],
        readBy: [],
        timestamp: serverTimestamp()
      });

      toast({ title: 'Document approved' });
      loadDocuments();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (docId: string, clientId: string) => {
    if (!firestore || !user) return;
    const reason = rejectionReason[docId];
    if (!reason) {
      toast({ title: 'Please provide a reason', variant: 'destructive' });
      return;
    }

    setProcessing(docId);
    try {
      await updateDoc(doc(firestore, 'clientDocuments', docId), {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: user.id,
        reviewedAt: serverTimestamp()
      });

      // Notify client
      await addDoc(collection(firestore, 'notifications'), {
        message: `Your document was rejected: ${reason}`,
        type: 'system',
        url: '/documents',
        recipients: [clientId],
        readBy: [],
        timestamp: serverTimestamp()
      });

      toast({ title: 'Document rejected' });
      setRejectionReason({ ...rejectionReason, [docId]: '' });
      loadDocuments();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return REQUIRED_DOCUMENTS.find(d => d.id === type)?.label || type;
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-muted-foreground">Admin access only</div>;
  }

  if (isLoading || !areServicesAvailable) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingDocs = documents.filter(d => d.status === 'pending');
  const reviewedDocs = documents.filter(d => d.status !== 'pending');

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-white mb-8">📋 Document Approvals</h1>

      {/* Pending Documents */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          Pending Review
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
            {pendingDocs.length}
          </Badge>
        </h2>
        <div className="grid gap-4">
          {pendingDocs.map((doc) => (
            <Card key={doc.id} className="p-6 bg-[#13131F] border-yellow-500/20">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-yellow-400" />
                    <h3 className="font-semibold text-white text-lg">
                      {getDocumentTypeLabel(doc.documentType)}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    <p className="text-gray-400">Client ID: <span className="text-gray-300 font-mono text-xs">{doc.clientId}</span></p>
                    <p className="text-gray-400">File: <span className="text-gray-300">{doc.fileName}</span></p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[240px] w-full md:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Document
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(doc.id, doc.clientId)}
                      disabled={processing === doc.id}
                    >
                      {processing === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(doc.id, doc.clientId)}
                      disabled={processing === doc.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  <Input
                    placeholder="Reason for rejection..."
                    value={rejectionReason[doc.id] || ''}
                    onChange={(e) => setRejectionReason({
                      ...rejectionReason,
                      [doc.id]: e.target.value
                    })}
                    className="bg-black/20 border-white/10"
                  />
                </div>
              </div>
            </Card>
          ))}

          {pendingDocs.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-white/10">
              <p className="text-gray-500 italic">No documents awaiting review</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviewed Documents */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Recently Reviewed ({reviewedDocs.length})
        </h2>
        <div className="space-y-3">
          {reviewedDocs.map((doc) => (
            <Card key={doc.id} className="p-4 bg-[#13131F] border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{getDocumentTypeLabel(doc.documentType)}</p>
                  <p className="text-gray-500 text-xs truncate">File: {doc.fileName}</p>
                </div>
                <Badge className={cn(
                  "font-semibold",
                  doc.status === 'approved'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                )}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </Badge>
              </div>
            </Card>
          ))}
          {reviewedDocs.length === 0 && (
            <p className="text-gray-500 text-center py-4">No reviewed documents yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
