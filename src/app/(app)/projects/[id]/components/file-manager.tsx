'use client';

import { useState, useRef } from 'react';
import type { ProjectFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, File as FileIcon, Download, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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

type FileManagerProps = {
  projectId: string;
  clientName?: string;
};

export function FileManager({ projectId, clientName = 'Unknown Client' }: FileManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addFile, files: allFiles, deleteFile } = useData();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = allFiles.filter(f => f.projectId === projectId);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      // Upload via API route
      const response = await fetch('/api/nas-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
          clientName: clientName,
          mimeType: file.type
        })
      });

      const result = await response.json();

      if (result.success) {
        addFile({
          projectId,
          name: file.name,
          url: result.nasPath,
          uploadedById: user.id,
          uploadedByName: user.name,
          uploadedByAvatar: user.avatar,
          type: 'nas',
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        });

        toast({ title: '✅ File Uploaded', description: `${file.name} uploaded to NAS successfully.` });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      toast({ title: '❌ Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = (file: ProjectFile) => {
    deleteFile(file.id);
    toast({ title: 'File Deleted', description: `${file.name} has been removed.` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">File Management</h2>
          <p className="text-sm text-muted-foreground">Upload and access all project-related files.</p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />
        <Button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0"
        >
          {isUploading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
          ) : (
            <><Upload className="mr-2 h-4 w-4" />Upload to NAS</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => {
          const uploadedAtDate = file.uploadedAt?.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt);
          return (
            <div key={file.id} className="rounded-xl p-4 flex items-center gap-4 bg-[#13131F] border border-white/5 hover:border-purple-500/20 transition-all">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <FileIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.size || 'NAS'} · {format(uploadedAtDate, 'PP')}</p>
              </div>
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
                      This will remove "{file.name}" from the project.
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
          );
        })}
        {files.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-12">
            No files uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
