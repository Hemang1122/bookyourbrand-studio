'use client';

import { useState } from 'react';
import type { ProjectFile } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link, Download, FileText, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-client';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AddFileLinkDialog } from './add-file-link-dialog';

type FileManagerProps = {
  projectId: string;
};

export function FileManager({ projectId }: FileManagerProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const filesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'projects', projectId, 'files');
  }, [firestore, projectId]);

  const { data: files, isLoading } = useCollection<ProjectFile>(filesCollectionRef);

  const handleAddFileLink = (name: string, url: string) => {
    if (!user || !filesCollectionRef) return;

    const fileData: Omit<ProjectFile, 'id'> = {
      name: name,
      url: url,
      uploadedById: user.id,
      uploadedByName: user.name,
      uploadedByAvatar: user.avatar,
      uploadedAt: serverTimestamp(),
      type: 'link', // We can mark this as a link
    };

    addDocumentNonBlocking(filesCollectionRef, fileData);

    toast({ title: 'File Link Added', description: `${name} has been added to the project.` });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddFileLinkDialog onAddFile={handleAddFileLink}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add File Link
          </Button>
        </AddFileLinkDialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading files...</TableCell></TableRow>}
            {files && files.map((file) => {
              const userAvatar = PlaceHolderImages.find(img => img.id === file.uploadedByAvatar);
              const uploadedAtDate = (file.uploadedAt as any)?.toDate ? (file.uploadedAt as any).toDate() : new Date();
              return (
                <TableRow key={file.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Link className="h-5 w-5 text-muted-foreground" />
                    {file.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{file.type || 'link'}</Badge>
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Open Link</span>
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && files?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No files added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
