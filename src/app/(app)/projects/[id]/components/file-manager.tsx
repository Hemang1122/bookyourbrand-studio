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
import { Link, Download, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AddFileLinkDialog } from './add-file-link-dialog';
import { useData } from '../../../data-provider';
import { Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

type FileManagerProps = {
  projectId: string;
};

export function FileManager({ projectId }: FileManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addFile, files: allFiles } = useData();

  const files = allFiles.filter(f => f.projectId === projectId);

  const handleAddFileLink = (name: string, url: string) => {
    if (!user) return;

    addFile({
      projectId,
      name,
      url,
      uploadedById: user.id,
      uploadedByName: user.name,
      uploadedByAvatar: user.avatar,
      type: 'link',
    });

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
            {files.map((file) => {
              const uploadedAtDate = file.uploadedAt.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt);
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
            {files.length === 0 && (
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
