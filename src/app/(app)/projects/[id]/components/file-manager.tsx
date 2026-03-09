'use client';

import { useState, useRef } from 'react';
import type { ProjectFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, File as FileIcon, Upload, Loader2, Download, Play, X, Info, Link as LinkIcon, Plus } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useData } from '../../../data-provider';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AddFileLinkDialog } from './add-file-link-dialog';

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
    toast({ title: 'Link Added', description: `"${name}" has been added to the project.` });
  };

  const handleDeleteFile = (file: ProjectFile) => {
    deleteFile(file.id);
    toast({ title: 'File Deleted', description: `${file.name} has been removed.` });
  };

  const isVideo = (name: string) => /\.(mp4|mov|avi|mkv|webm)$/i.test(name);
  const getDownloadUrl = (url: string) => url.startsWith('/CLIENT') ? `/api/nas-preview?path=${encodeURIComponent(url)}` : url;

  return (
    <div className="space-y-4">
      {/* File Details Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131F] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-purple-400" />
                <p className="text-white font-medium">Asset Details</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  {selectedFile.type === 'link' ? (
                    <LinkIcon className="h-10 w-10 text-blue-400" />
                  ) : isVideo(selectedFile.name) ? (
                    <Play className="h-10 w-10 text-purple-400" />
                  ) : (
                    <FileIcon className="h-10 w-10 text-purple-400" />
                  )}
                </div>
                <h4 className="font-bold text-white break-words">{selectedFile.name}</h4>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                  {selectedFile.type === 'link' ? 'External File Link' : 'Synology NAS Storage'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white capitalize">{selectedFile.type || 'File'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Size</span>
                  <span className="text-white">{selectedFile.size || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Uploaded</span>
                  <span className="text-white">
                    {selectedFile.uploadedAt?.toDate ? format(selectedFile.uploadedAt.toDate(), 'PP') : format(new Date(selectedFile.uploadedAt), 'PP')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">By</span>
                  <span className="text-white">{selectedFile.uploadedByName}</span>
                </div>
              </div>

              <div className="pt-4">
                <a href={getDownloadUrl(selectedFile.url)} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold">
                    {selectedFile.type === 'link' ? <LinkIcon className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                    {selectedFile.type === 'link' ? 'Open Link' : 'Download Asset'}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Project Assets</h2>
          <p className="text-sm text-muted-foreground">Manage storage files and external shared links.</p>
        </div>
        <div className="flex items-center gap-2">
          <AddFileLinkDialog onAddFile={handleAddFileLink}>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <Plus className="h-4 w-4 mr-2" /> Add Link
            </Button>
          </AddFileLinkDialog>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="*/*" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
            {isUploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Uploading...'}</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />Upload to NAS</>
            )}
          </Button>
        </div>
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
          const isLink = file.type === 'link';
          
          return (
            <div key={file.id} className="rounded-xl p-4 flex items-center gap-4 bg-[#13131F] border border-white/5 hover:border-purple-500/20 transition-all">
              <div 
                className={cn(
                  "p-3 rounded-xl cursor-pointer transition-all",
                  isLink ? "bg-blue-500/10 hover:bg-blue-500/20" : "bg-purple-500/10 hover:bg-purple-500/20"
                )} 
                onClick={() => setSelectedFile(file)}
              >
                {isLink ? (
                  <LinkIcon className="h-5 w-5 text-blue-400" />
                ) : isVideo(file.name) ? (
                  <Play className="h-5 w-5 text-purple-400" />
                ) : (
                  <FileIcon className="h-5 w-5 text-purple-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedFile(file)}>
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isLink ? 'Link' : (file.size || 'NAS')} · {format(uploadedAtDate, 'PP')}
                </p>
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
                      {isLink 
                        ? `This will remove the link to "${file.name}" from the project.`
                        : `This will remove the reference to "${file.name}" from the project. The physical file on the NAS will not be deleted.`
                      }
                    </AlertDialogDescription>
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
          <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-12 border border-dashed border-white/5 rounded-2xl">
            No project assets found.
          </div>
        )}
      </div>
    </div>
  );
}
