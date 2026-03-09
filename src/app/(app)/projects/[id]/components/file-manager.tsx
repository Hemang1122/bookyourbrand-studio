'use client';

import { useState, useRef } from 'react';
import type { ProjectFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, File as FileIcon, Upload, Loader2, Download, Play, X, HardDrive } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useData } from '../../../data-provider';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

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
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = allFiles.filter(f => f.projectId === projectId);

  const uploadChunk = async (chunk: Blob, fileName: string, chunkIndex: number, totalChunks: number): Promise<any> => {
    const formData = new FormData();
    formData.append('file', chunk, fileName);
    formData.append('clientName', clientName);
    formData.append('chunkIndex', String(chunkIndex));
    formData.append('totalChunks', String(totalChunks));

    const response = await fetch('/api/nas-upload', { method: 'POST', body: formData });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let shareUrl: string | null = null;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const result = await uploadChunk(chunk, file.name, i, totalChunks);

        if (!result.success) throw new Error(result.error || 'Chunk upload failed');

        const progress = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(progress);

        if (result.shareUrl) shareUrl = result.shareUrl;
      }

      addFile({
        projectId,
        name: file.name,
        url: shareUrl || `/CLIENT FILES/${clientName}/${file.name}`,
        uploadedById: user.id,
        uploadedByName: user.name,
        uploadedByAvatar: user.avatar,
        type: 'nas',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      });

      toast({ title: '✅ File Uploaded', description: `${file.name} uploaded to NAS successfully.` });
    } catch (error: any) {
      toast({ title: '❌ Upload Failed', description: error.message, variant: 'destructive' });
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
  
  const getDownloadUrl = (url: string) => {
    if (!url) return '';
    if (url.includes("byb.i234.me") || url.startsWith('/CLIENT')) {
      return `/api/nas-preview?path=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div className="space-y-4">
      {/* File Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131F] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <p className="text-white font-medium truncate">File Details</p>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                {isVideo(selectedFile.name) ? (
                  <Play className="h-10 w-10 text-purple-400" />
                ) : (
                  <FileIcon className="h-10 w-10 text-purple-400" />
                )}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 truncate px-4">{selectedFile.name}</h3>
              <div className="flex flex-col items-center gap-1 mb-8">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-400">
                  {selectedFile.size || 'NAS Storage'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Stored on Synology NAS
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <a 
                  href={getDownloadUrl(selectedFile.url)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  download={selectedFile.name}
                  className="w-full"
                >
                  <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20">
                    <Download className="h-5 w-5 mr-2" /> Download File
                  </Button>
                </a>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">File Management</h2>
          <p className="text-sm text-muted-foreground">Upload and access all project-related files directly from the NAS.</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="*/*" />
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
          {isUploading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Uploading...'}</>
          ) : (
            <><Upload className="mr-2 h-4 w-4" />Upload to NAS</>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-white/5 rounded-full h-2 mb-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* File Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => {
          const uploadedAtDate = file.uploadedAt?.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt);
          return (
            <div key={file.id} className="rounded-xl p-4 flex items-center gap-4 bg-[#13131F] border border-white/5 hover:border-purple-500/20 transition-all group">
              <div className="p-3 rounded-xl bg-purple-500/10 cursor-pointer hover:bg-purple-500/20 transition-all" onClick={() => setSelectedFile(file)}>
                {isVideo(file.name) ? <Play className="h-5 w-5 text-purple-400" /> : <FileIcon className="h-5 w-5 text-purple-400" />}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedFile(file)}>
                <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">{file.name}</p>
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
                    <AlertDialogDescription>This will remove "{file.name}" from the project storage reference. The file will remain on the physical NAS but will no longer be linked to this project.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteFile(file)} className="bg-destructive hover:bg-destructive/90">Delete Reference</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
        {files.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-12 border border-dashed border-white/5 rounded-2xl">
            No files uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
