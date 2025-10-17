'use client';

import { useRef, useState } from 'react';
import type { ProjectFile, User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-client';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { uploadFile } from '@/lib/storage';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type FileManagerProps = {
  projectId: string;
};

export function FileManager({ projectId }: FileManagerProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'projects', projectId, 'files');
  }, [firestore, projectId]);

  const { data: files, isLoading } = useCollection<ProjectFile>(filesCollectionRef);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !filesCollectionRef) return;

    setIsUploading(true);
    try {
      const downloadURL = await uploadFile(file, `projects/${projectId}/${file.name}`);

      const fileData: Omit<ProjectFile, 'id'> = {
        name: file.name,
        url: downloadURL,
        uploadedById: user.id,
        uploadedByName: user.name,
        uploadedByAvatar: user.avatar,
        uploadedAt: serverTimestamp(),
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
      };

      addDocumentNonBlocking(filesCollectionRef, fileData);

      toast({ title: 'File Uploaded', description: `${file.name} has been added to the project.` });
    } catch (error) {
      console.error('File upload error:', error);
      toast({ title: 'Upload Failed', description: 'There was an error uploading your file.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        <Button onClick={handleUploadClick} disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload File
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading files...</TableCell></TableRow>}
            {files && files.map((file) => {
              const userAvatar = PlaceHolderImages.find(img => img.id === file.uploadedByAvatar);
              const uploadedAtDate = (file.uploadedAt as any)?.toDate ? (file.uploadedAt as any).toDate() : new Date();
              return (
                <TableRow key={file.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    {file.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{file.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={userAvatar?.imageUrl} alt={file.uploadedByName} data-ai-hint={userAvatar?.imageHint} />
                        <AvatarFallback>{file.uploadedByName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{file.uploadedByName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(uploadedAtDate, 'PP')}</TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && files?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No files uploaded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
