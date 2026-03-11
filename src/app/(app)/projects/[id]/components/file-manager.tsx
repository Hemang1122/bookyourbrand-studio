'use client';

import { useState, useRef, useMemo } from 'react';
import type { ProjectFile, ProjectFolder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, File as FileIcon, Upload, Loader2, Download, X, FolderPlus, Folder, ChevronRight, Info, Save, Play, Eye, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useData } from '../../../data-provider';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddFileLinkDialog } from './add-file-link-dialog';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

type FileManagerProps = {
  projectId: string;
  clientName?: string;
};

export function FileManager({ projectId, clientName = 'Unknown Client' }: FileManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addFile, files: allFiles, deleteFile, folders: allFolders, addFolder, deleteFolder, updateFile } = useData();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [infoFile, setInfoFile] = useState<ProjectFile | null>(null);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  const isVideo = (fileName: string) => /\.(mp4|webm|mov|mkv)$/i.test(fileName);

  const getDownloadUrl = (file: ProjectFile) => {
    // If it's a link, return as is
    if (file.type === 'link') return file.url;
    // If it's a NAS file (no shareUrl), use our proxy
    if (file.type === 'nas' && file.url.startsWith('/CLIENT FILES')) {
      return `/api/nas-download-redirect?path=${encodeURIComponent(file.url)}`;
    }
    // Otherwise use the URL directly
    return file.url;
  };

  // Folders for this project
  const folders = useMemo(() => 
    allFolders.filter(f => f.projectId === projectId), 
  [allFolders, projectId]);

  const currentFolder = useMemo(() => 
    folders.find(f => f.id === currentFolderId), 
  [folders, currentFolderId]);

  // Files specifically inside the currently selected folder (or root files with folderId === null)
  const filesInView = useMemo(() => 
    allFiles.filter(f => f.projectId === projectId && f.folderId === currentFolderId), 
  [allFiles, projectId, currentFolderId]);

  // "Legacy" or "Ungrouped" files that have no folderId field at all, or it's empty
  const ungroupedFiles = useMemo(() => 
    allFiles.filter(f => f.projectId === projectId && !f.folderId), 
  [allFiles, projectId]);

  const uploadChunk = async (chunk: Blob, fileName: string, chunkIndex: number, totalChunks: number): Promise<any> => {
    const formData = new FormData();
    formData.append('file', chunk, fileName);
    formData.append('clientName', clientName);
    formData.append('folderName', currentFolder?.name || '');
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
        folderId: currentFolderId,
        name: file.name,
        url: shareUrl || `/CLIENT FILES/${clientName}${currentFolder ? '/' + currentFolder.name : ''}/${file.name}`,
        uploadedById: user.id,
        uploadedByName: user.name,
        uploadedByAvatar: user.avatar,
        type: 'nas',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      });

      toast({ title: '✅ File Uploaded', description: `${file.name} uploaded successfully.` });
    } catch (error: any) {
      toast({ title: '❌ Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveLink = (name: string, url: string) => {
    if (!user) return;
    addFile({
      projectId,
      folderId: currentFolderId,
      name,
      url,
      uploadedById: user.id,
      uploadedByName: user.name,
      uploadedByAvatar: user.avatar,
      type: 'link',
      size: 'External Link'
    });
    toast({ title: '✅ Link Added', description: `"${name}" added to workspace.` });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      await addFolder({
        projectId,
        name: newFolderName.trim(),
      });
      toast({ title: 'Folder Created', description: `"${newFolderName}" is ready.` });
      setIsNewFolderOpen(false);
      setNewFolderName('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFile = (file: ProjectFile) => {
    deleteFile(file.id);
    toast({ title: 'File Deleted', description: `${file.name} removed.` });
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folder: ProjectFolder) => {
    e.stopPropagation();
    await deleteFolder(folder.id);
    toast({ title: 'Folder Deleted', description: `"${folder.name}" removed.` });
  };

  const handleSaveDescription = async () => {
    if (!infoFile) return;
    setIsSavingDescription(true);
    try {
      await updateFile(infoFile.id, { description: fileDescription });
      toast({ title: 'Description Saved' });
      setInfoFile(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSavingDescription(false);
    }
  };

  const openInfo = (e: React.MouseEvent, file: ProjectFile) => {
    e.stopPropagation();
    setInfoFile(file);
    setFileDescription(file.description || '');
  };

  const renderFileCard = (file: ProjectFile) => (
    <div 
      key={file.id} 
      className="group rounded-xl p-4 flex items-center gap-4 bg-[#13131F] border border-white/5 hover:border-purple-500/30 transition-all relative"
    >
      <div className="p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer" onClick={() => setPreviewFile(file)}>
        {file.type === 'link' ? <LinkIcon className="h-6 w-6 text-blue-400" /> : <FileIcon className="h-6 w-6 text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPreviewFile(file)}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate pr-2">{file.name}</p>
          {file.type === 'link' && <Badge variant="outline" className="text-[8px] h-4 px-1.5 py-0 border-blue-500/30 text-blue-400 bg-blue-500/5">LINK</Badge>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {file.size || 'NAS'} · {file.uploadedAt ? format(file.uploadedAt?.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt), 'MMM d') : 'Recently'}
        </p>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-purple-400" onClick={(e) => openInfo(e, file)}>
          <Info className={cn("h-4 w-4", file.description && "text-purple-400 fill-purple-400/20")} />
        </Button>
        <a href={getDownloadUrl(file)} target={file.type === 'link' ? "_blank" : undefined} download={file.type !== 'link' ? file.name : undefined} rel={file.type === 'link' ? "noopener noreferrer" : undefined}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
            {file.type === 'link' ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </Button>
        </a>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#13131F] border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete file?</AlertDialogTitle>
              <AlertDialogDescription>Remove "{file.name}" from this project?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteFile(file)} className="bg-red-600">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* File Info Dialog */}
      <Dialog open={!!infoFile} onOpenChange={(open) => !open && setInfoFile(null)}>
        <DialogContent className="sm:max-w-md bg-[#13131F] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>File Description</DialogTitle>
            <DialogDescription>Add notes or instructions for this file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <FileIcon className="h-5 w-5 text-purple-400" />
              <p className="text-sm font-medium truncate">{infoFile?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={fileDescription} 
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Type file details here..."
                rows={5}
                className="bg-black/40 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoFile(null)}>Cancel</Button>
            <Button onClick={handleSaveDescription} disabled={isSavingDescription}>
              {isSavingDescription ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Description
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131F] rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <p className="text-white font-medium truncate">{previewFile.name}</p>
              <div className="flex items-center gap-2">
                <a 
                  href={getDownloadUrl(previewFile)} 
                  target={previewFile.type === 'link' ? "_blank" : undefined}
                  download={previewFile.type !== 'link' ? previewFile.name : undefined}
                  rel={previewFile.type === 'link' ? "noopener noreferrer" : undefined}
                >
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    {previewFile.type === 'link' ? <><ExternalLink className="h-4 w-4 mr-2" /> Open Link</> : <><Download className="h-4 w-4 mr-2" /> Download</>}
                  </Button>
                </a>
                <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)}>
                  <X className="h-5 w-5 text-white" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 flex items-center justify-center min-h-[300px] flex-1 bg-black/20 overflow-auto">
              {previewFile.type === 'link' ? (
                <div className="text-center p-12">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                    <LinkIcon className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{previewFile.name}</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">This is an external link. Click the button below to visit the external site.</p>
                  <a href={previewFile.url} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-14 px-8 rounded-xl font-bold">
                      <ExternalLink className="h-5 w-5 mr-3" /> Visit External Link
                    </Button>
                  </a>
                </div>
              ) : isVideo(previewFile.name) ? (
                <div className="text-center">
                  <Play className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                  <p className="text-white mb-4">Video preview not available</p>
                  <a href={getDownloadUrl(previewFile)} download={previewFile.name}>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Download className="h-4 w-4 mr-2" /> Download Video
                    </Button>
                  </a>
                </div>
              ) : isImage(previewFile.name) ? (
                <img src={previewFile.type === 'nas' ? `/api/nas-preview?path=${encodeURIComponent(previewFile.url)}` : previewFile.url} alt={previewFile.name} className="max-w-full max-h-[65vh] rounded-xl object-contain" />
              ) : (
                <div className="text-center">
                  <FileIcon className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                  <p className="text-white mb-4">{previewFile.name}</p>
                  <a href={getDownloadUrl(previewFile)} download={previewFile.name}>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Download className="h-4 w-4 mr-2" /> Download File
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Project Workspace</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button 
              onClick={() => setCurrentFolderId(null)}
              className={cn("hover:text-purple-400 transition-colors", !currentFolderId && "text-white font-bold")}
            >
              All Files
            </button>
            {currentFolder && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white font-bold">{currentFolder.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-white">
                <FolderPlus className="h-4 w-4 mr-2" /> New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#13131F] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input 
                  id="folder-name" 
                  value={newFolderName} 
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Raw Clips, Sound Effects"
                  className="bg-black/40 border-white/10 mt-2"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewFolderOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()}>
                  {isCreatingFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AddFileLinkDialog onAddFile={handleSaveLink}>
            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-white">
              <LinkIcon className="h-4 w-4 mr-2" /> Add Link
            </Button>
          </AddFileLinkDialog>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <Button 
            size="sm"
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading} 
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0"
          >
            {isUploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadProgress}%</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />Upload</>
            )}
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* Main Explorer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Render Folders (only in root) */}
        {!currentFolderId && folders.map(folder => (
          <div 
            key={folder.id} 
            onClick={() => setCurrentFolderId(folder.id)}
            className="group rounded-xl p-4 flex items-center gap-4 bg-[#13131F] border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer relative"
          >
            <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
              <Folder className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{folder.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Folder</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#13131F] border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete folder?</AlertDialogTitle>
                  <AlertDialogDescription>This will remove the folder reference. Physical files remain on NAS.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={(e) => handleDeleteFolder(e, folder)} className="bg-red-600">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}

        {/* Render Folder-Specific Files */}
        {filesInView.map(file => renderFileCard(file))}
      </div>

      {/* Ungrouped/Legacy Files Section (Only visible at Root) */}
      {!currentFolderId && ungroupedFiles.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/5">
              <FileIcon className="h-4 w-4 text-gray-400" />
            </div>
            <h3 className="font-semibold text-white">Ungrouped Files</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ungroupedFiles.map(file => renderFileCard(file))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {folders.length === 0 && filesInView.length === 0 && (!currentFolderId ? ungroupedFiles.length === 0 : true) && (
        <div className="col-span-full py-20 text-center rounded-2xl border border-dashed border-white/5">
          <FileIcon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-gray-500">Empty workspace. Create a folder, upload a file, or add a link.</p>
        </div>
      )}
    </div>
  );
}
