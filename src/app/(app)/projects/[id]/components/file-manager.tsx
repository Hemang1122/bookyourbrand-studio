'use client';

import { useState, useRef } from 'react';
import type { ProjectFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, File as FileIcon, Upload, Loader2, Download, Play, X } from 'lucide-react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = allFiles.filter(f => f.projectId === projectId);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('📤 Starting upload:', file.name);
      setUploadProgress(10);

      // Always use server upload (skip browser direct upload)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientName', clientName);
      
      console.log('📡 Sending to /api/nas-upload...');
      setUploadProgress(30);

      const response = await fetch('/api/nas-upload', { 
        method: 'POST', 
        body: formData 
      });

      setUploadProgress(60);
      
      const result = await response.json();
      console.log('📥 Server response:', result);

      setUploadProgress(90);

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Upload failed with status ${response.status}`);
      }

      addFile({
        projectId,
        name: file.name,
        url: result.shareUrl || result.nasPath,
        uploadedById: user.id,
        uploadedByName: user.name,
        uploadedByAvatar: user.avatar,
        type: 'nas',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      });

      setUploadProgress(100);

      toast({ 
        title: '✅ File Uploaded', 
        description: `${file.name} uploaded to NAS successfully.` 
      });

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      toast({ 
        title: '❌ Upload Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = (file: ProjectFile) => {
    deleteFile(file.id);
    toast({ title: 'File Deleted', description: `${file.name} has been removed.` });
  };

  const isVideo = (name: string) => /\.(mp4|mov|avi|mkv|webm)$/i.test(name);
  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  const isPdf = (name: string) => /\.pdf$/i.test(name);

  return (
    <div className="space-y-4">
      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131F] rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <p className="text-white font-medium truncate">{previewFile.name}</p>
              <div className="flex items-center gap-2">
                {previewFile.url && !previewFile.url.startsWith('/CLIENT') && (
                  <a href={previewFile.url} target="_blank" rel="noopener noreferrer" download={previewFile.name}>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </a>
                )}
                <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)} className="text-muted-foreground hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-auto">
              {isVideo(previewFile.name) && previewFile.url && !previewFile.url.startsWith('/CLIENT') ? (
                <video controls autoPlay className="w-full max-h-[65vh] rounded-xl" src={previewFile.url}>
                  Your browser does not support video playback.
                </video>
              ) : isImage(previewFile.name) && previewFile.url && !previewFile.url.startsWith('/CLIENT') ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[65vh] rounded-xl object-contain" />
              ) : isPdf(previewFile.name) && previewFile.url && !previewFile.url.startsWith('/CLIENT') ? (
                <iframe src={previewFile.url} className="w-full h-[65vh] rounded-xl" />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <FileIcon className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                  <p className="text-white font-medium mb-2">{previewFile.name}</p>
                  <p className="text-sm mb-4">Preview not available for this file type.</p>
                  {previewFile.url && !previewFile.url.startsWith('/CLIENT') && (
                    <a href={previewFile.url} target="_blank" rel="noopener noreferrer" download={previewFile.name}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Download className="h-4 w-4 mr-2" /> Download File
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">File Management</h2>
          <p className="text-sm text-muted-foreground">Upload and access all project-related files.</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="*/*" />
        <Button onClick={handleUploadClick} disabled={isUploading} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
          {isUploading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading ({uploadProgress}%)...</>
          ) : (
            <><Upload className="mr-2 h-4 w-4" />Upload to NAS</>
          )}
        </Button>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => {
          const uploadedAtDate = file.uploadedAt?.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt);
          return (
            <div key={file.id} className="rounded-xl p-4 flex items-center gap-4 bg-[#13131F] border border-white/5 hover:border-purple-500/20 transition-all">
              <div
                className="p-3 rounded-xl bg-purple-500/10 cursor-pointer hover:bg-purple-500/20 transition-all"
                onClick={() => setPreviewFile(file)}
              >
                {isVideo(file.name) ? (
                  <Play className="h-5 w-5 text-purple-400" />
                ) : (
                  <FileIcon className="h-5 w-5 text-purple-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPreviewFile(file)}>
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
                    <AlertDialogDescription>This will remove "{file.name}" from the project.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteFile(file)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
        {files.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-12">No files uploaded yet.</div>
        )}
      </div>
    </div>
  );
}
