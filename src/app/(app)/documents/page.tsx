'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { useFirebaseServices } from '@/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, Clock, XCircle, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { REQUIRED_DOCUMENTS, type ClientDocument } from '@/lib/document-types';
import { cn } from '@/lib/utils';
import { useData } from '../data-provider';

export default function DocumentsPage() {
  const { user } = useAuth();
  const { firestore, firebaseApp, areServicesAvailable } = useFirebaseServices();
  const { users } = useData();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && firestore) {
      loadDocuments();
    }
  }, [user, firestore]);

  const loadDocuments = async () => {
    if (!user || !firestore) return;

    try {
      const docsRef = collection(firestore, 'clientDocuments');
      const q = query(docsRef, where('clientId', '==', user.id));
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClientDocument[];
      
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!user || !firestore || !firebaseApp) return;

    setUploading(documentType);

    try {
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, `client-documents/${user.id}/${documentType}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      const docRef = await addDoc(collection(firestore, 'clientDocuments'), {
        clientId: user.id,
        documentType,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        uploadedAt: serverTimestamp(),
        status: 'pending'
      });

      // Find all admin users to notify
      const adminIds = (users || []).filter(u => u.role === 'admin').map(u => u.id);

      // Create notification for admin
      if (adminIds.length > 0) {
        await addDoc(collection(firestore, 'notifications'), {
          message: `${user.name} uploaded ${documentType.replace('_', ' ')} document`,
          type: 'system',
          url: '/admin/documents',
          recipients: adminIds,
          readBy: [],
          timestamp: serverTimestamp()
        });
      }

      toast({
        title: 'Success!',
        description: 'Document uploaded successfully. Awaiting admin approval.',
      });

      loadDocuments();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(null);
    }
  };

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.documentType === docType);
    return doc?.status || null;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Not Uploaded</Badge>;
    
    const statusConfig = {
      pending: { label: 'Pending Review', icon: Clock, className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
      approved: { label: 'Approved', icon: CheckCircle, className: 'bg-green-500/10 text-green-400 border-green-500/20' },
      rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-500/10 text-red-400 border-red-500/20' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">This page is for clients only.</p>
      </div>
    );
  }

  if (isLoading || !areServicesAvailable) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">📄 My Documents</h1>
        <p className="text-gray-400">Upload required documents to complete your profile</p>
      </div>

      <div className="space-y-4">
        {REQUIRED_DOCUMENTS.map((docType) => {
          const status = getDocumentStatus(docType.id);
          const uploadedDoc = documents.find(d => d.documentType === docType.id);
          const isUploading = uploading === docType.id;

          return (
            <Card key={docType.id} className="p-6 bg-[#13131F] border-white/5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{docType.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{docType.label}</h3>
                      <p className="text-sm text-gray-400">{docType.description}</p>
                    </div>
                  </div>

                  {uploadedDoc && (
                    <div className="mt-4 p-3 bg-black/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-300">{uploadedDoc.fileName}</span>
                        </div>
                        <a
                          href={uploadedDoc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </a>
                      </div>
                      {uploadedDoc.rejectionReason && (
                        <p className="text-xs text-red-400 mt-2">
                          Reason: {uploadedDoc.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  {getStatusBadge(status)}
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(docType.id, file);
                      }}
                      disabled={isUploading || status === 'approved'}
                    />
                    <Button
                      asChild
                      size="sm"
                      variant={status === 'approved' ? 'ghost' : 'default'}
                      className={cn(
                        isUploading && "cursor-not-allowed opacity-50",
                        status === 'approved' && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <span>
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : status === 'approved' ? (
                          'Approved'
                        ) : status ? (
                          'Re-upload'
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
