
'use client';

import { useState, useRef, useMemo } from 'react';
import type { ProjectFile, AssetCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Trash2, 
  File as FileIcon, 
  Upload, 
  Loader2, 
  Download, 
  Info,
  Pencil,
  FileVideo,
  FileCheck
} from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useData } from '../../../data-provider';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

type FileManagerProps = {
  projectId: string;
  clientName?: string;
};

export function FileManager({ projectId, clientName = 'Unknown Client' }: FileManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addFile, updateFile, files: allFiles, deleteFile } = useData();
  
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('raw');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized data
  const files = useMemo(() => 
    allFiles.filter(f => f.projectId === projectId && f.category === activeCategory),
    [allFiles, projectId, activeCategory]
  );

  // Logic
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
        category: activeCategory,
        name: file.name,
        url: shareUrl || `/CLIENT FILES/${clientName}/${file.name}`,
        uploadedById: user.id,
        uploadedByName: user.name,
        uploadedByAvatar: user.avatar,
        type: 'nas',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      });

      toast({ title: '✅ Upload Success', description: `${file.name} is now stored on the NAS.` });
    } catch (error: any) {
      toast({ title: '❌ Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveDescription = () => {
    if (!selectedFile) return;
    updateFile(selectedFile.id, { description: tempDescription });
    setSelectedFile({ ...selectedFile, description: tempDescription });
    setIsEditingDescription(false);
    toast({ title: 'Description updated' });
  };

  const isVideo = (name: string) => /\.(mp4|mov|avi|mkv|webm)$/i.test(name);
  const getDownloadUrl = (url: string) => url.startsWith('/CLIENT') ? `/api/nas-preview?path=${encodeURIComponent(url)}` : url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-6">
        {/* Category Tabs & Upload */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#13131F] p-4 rounded-2xl border border-white/5 shadow-xl">
          <Tabs value={activeCategory} onValueChange={(v) => { setActiveCategory(v as AssetCategory); setSelectedFile(null); }} className="w-full sm:w-auto">
            <TabsList className="bg-black/40 border-white/10">
              <TabsTrigger value="raw" className="gap-2 data-[state=active]:bg-purple-600">
                <FileVideo className="h-4 w-4" /> Raw Material
              </TabsTrigger>
              <TabsTrigger value="deliverable" className="gap-2 data-[state=active]:bg-green-600">
                <FileCheck className="h-4 w-4" /> Final Deliverables
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-500 border-0">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {isUploading ? `${uploadProgress}%` : 'Upload Asset'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="w-full bg-white/5 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {/* Assets Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map(file => (
            <div 
              key={file.id} 
              onClick={() => setSelectedFile(file)}
              className={cn(
                "relative group rounded-2xl p-4 bg-[#13131F] border transition-all cursor-pointer flex flex-col items-center text-center shadow-lg",
                selectedFile?.id === file.id ? "border-purple-500 bg-purple-500/5 ring-4 ring-purple-500/10" : "border-white/5 hover:border-purple-500/30"
              )}
            >
              <div className="p-4 rounded-2xl bg-white/5 mb-3">
                {isVideo(file.name) ? <FileVideo className="h-10 w-10 text-purple-400" /> : <FileIcon className="h-10 w-10 text-gray-400" />}
              </div>
              <p className="text-sm font-medium text-white truncate w-full">{file.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase">{file.size || 'NAS Storage'}</p>
            </div>
          ))}

          {files.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
              <FileIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-gray-500">No assets in this category.</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Side Panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 rounded-3xl bg-[#13131F] border border-white/5 overflow-hidden shadow-2xl h-[calc(100vh-12rem)] flex flex-col">
          <div className="p-6 border-b border-white/5 bg-gradient-to-br from-purple-900/20 to-transparent">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-400" /> Asset Details
            </h3>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            {selectedFile ? (
              <>
                <div className="text-center pb-6 border-b border-white/5">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    {isVideo(selectedFile.name) ? <FileVideo className="h-10 w-10 text-purple-400" /> : <FileIcon className="h-10 w-10 text-gray-400" />}
                  </div>
                  <h4 className="font-bold text-white break-words px-2">{selectedFile.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                    Stored on Synology NAS
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Description</span>
                    {!isEditingDescription && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setTempDescription(selectedFile.description || ''); setIsEditingDescription(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <Textarea 
                        value={tempDescription} 
                        onChange={(e) => setTempDescription(e.target.value)} 
                        placeholder="Add metadata or instructions..."
                        className="min-h-[120px] bg-black/40 text-sm border-purple-500/30"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveDescription} className="flex-1 bg-purple-600">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(false)} className="flex-1">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 leading-relaxed italic bg-black/20 p-4 rounded-xl border border-white/5">
                      {selectedFile.description || 'No description provided for this asset.'}
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 space-y-3">
                  <a href={getDownloadUrl(selectedFile.url)} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 font-bold">
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </a>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full text-red-400 hover:bg-red-500/10 hover:text-red-300">
                        <Trash2 className="h-4 w-4 mr-2" /> Remove Asset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete Asset?</AlertDialogTitle><AlertDialogDescription>This removes the file reference from the CRM. The physical file remains on your NAS hardware.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteFile(selectedFile.id); setSelectedFile(null); }} className="bg-red-600">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <FileVideo className="h-12 w-12 mb-4" />
                <p className="text-sm">Select a file to view its<br />details and description.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
