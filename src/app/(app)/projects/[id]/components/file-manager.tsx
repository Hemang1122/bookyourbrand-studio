
'use client';

import { useState, useRef } from 'react';
import type { ProjectFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, File as FileIcon, Download, Upload, Loader2, PlayCircle, Eye } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type FileManagerProps = {
  projectId: string;
  clientName?: string;
};

export function FileManager({ projectId, clientName = 'Unknown Client' }: FileManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addFile, files: allFiles, deleteFile } = useData();
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientName', clientName);

      // Upload via API route
      const response = await fetch('/api/nas-upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        addFile({
          projectId,
          name: file.name,
          url: result.shareUrl || result.nasPath, // Use share link if available
          nasPath: result.nasPath, // Store internal path for management
          uploadedById: user.id,
          uploadedByName: user.name,
          uploadedByAvatar: user.avatar,
          type: 'nas',
          fileType: file.type,
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

  const isVideo = (fileName: string) => {
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    return videoExts.some(ext => fileName.toLowerCase().endsWith(ext));
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
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg"
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
          const isVid = isVideo(file.name);
          
          return (
            <div key={file.id} className="group relative rounded-xl p-4 flex flex-col bg-[#13131F] border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn("p-3 rounded-xl", isVid ? "bg-blue-500/10" : "bg-purple-500/10")}>
                  {isVid ? <PlayCircle className="h-5 w-5 text-blue-400" /> : <FileIcon className="h-5 w-5 text-purple-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{file.size} · {format(uploadedAtDate, 'PP')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                {isVid ? (
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] border-white/10 hover:bg-blue-500/10 hover:text-blue-400" onClick={() => setPreviewFile(file)}>
                    <Eye className="h-3 w-3 mr-1.5" /> Preview
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm" className="flex-1 h-8 text-[10px] border-white/10">
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3 w-3 mr-1.5" /> View/Download
                    </a>
                  </Button>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove "{file.name}" from the project storage.
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
            </div>
          );
        })}
        {files.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-white/5">
            <FileIcon className="h-10 w-10 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
          </div>
        )}
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl bg-[#0F0F1A] border-white/10 p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-white/5 bg-[#13131F]">
            <DialogTitle className="text-white flex items-center justify-between pr-8">
              <span className="truncate">{previewFile?.name}</span>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 ml-4">
                <a href={previewFile?.url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" /> Download
                </a>
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black flex items-center justify-center">
            {previewFile && (
              <video 
                src={previewFile.url} 
                controls 
                autoPlay 
                className="max-h-full max-w-full"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
