
'use client';

import { useState } from 'react';
import type { ProjectFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, File as FileIcon, Download } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AddFileLinkDialog } from './add-file-link-dialog';
import { useData } from '../../../data-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type FileManagerProps = {
  projectId: string;
};

export function FileManager({ projectId }: FileManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addFile, files: allFiles, deleteFile } = useData();

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
      size: 'External Link'
    });

    toast({ title: 'File Link Added', description: `${name} has been added to the project.` });
  };
  
  const handleDeleteFile = (file: ProjectFile) => {
    deleteFile(file.id);
    toast({ title: 'File Deleted', description: `${file.name} has been removed.` });
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-xl font-bold text-white">File Management</h2>
                <p className="text-sm text-muted-foreground">Upload and access all project-related files.</p>
            </div>
            <AddFileLinkDialog onAddFile={handleAddFileLink}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
                    <Plus className="mr-2 h-4 w-4" />
                    Add File Link
                </Button>
            </AddFileLinkDialog>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => {
            const uploadedAtDate = file.uploadedAt.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt);
            return (
                <div key={file.id} className="rounded-xl p-4 flex items-center gap-4 bg-[#13131F] border border-white/5 hover:border-purple-500/20 transition-all">
                    <div className="p-3 rounded-xl bg-purple-500/10">
                        <FileIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size || 'Link'} · {format(uploadedAtDate, 'PP')}</p>
                    </div>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-purple-400">
                            <Download className="h-4 w-4" />
                        </Button>
                    </a>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the file link for "{file.name}".
                            The linked file itself will not be affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFile(file)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            )
        })}
        {files.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-12">
            No files added yet.
          </div>
        )}
      </div>
    </div>
  );
}

    