'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle, XCircle, Loader2, Link as LinkIcon } from 'lucide-react';

interface NASFileUploadProps {
  clientName: string;
  projectId: string;
  onUploadComplete?: (data: { nasPath: string; shareUrl: string | null; fileName: string }) => void;
}

export function NASFileUpload({ clientName, projectId, onUploadComplete }: NASFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ 
    success: boolean; 
    message: string; 
    shareUrl?: string;
    nasPath?: string;
    fileName?: string;
  } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientName', clientName);
      formData.append('projectId', projectId);

      const response = await fetch('/api/nas-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: `✅ ${data.fileName} uploaded successfully!`,
          shareUrl: data.shareUrl,
          nasPath: data.nasPath,
          fileName: data.fileName
        });
        
        if (onUploadComplete) {
          onUploadComplete({
            nasPath: data.nasPath,
            shareUrl: data.shareUrl,
            fileName: data.fileName
          });
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Upload failed'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Upload failed: ' + (error as Error).message
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex-1">
          <Input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
        </label>
        
        <Button disabled={uploading} size="sm" variant="outline" className="shrink-0">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload to NAS
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            {result.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <p className="font-medium text-sm">{result.message}</p>
            
            {result.nasPath && (
              <p className="text-xs opacity-75 truncate">
                Stored at: {result.nasPath}
              </p>
            )}
            
            {result.shareUrl && (
              <a 
                href={result.shareUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium hover:underline text-primary"
              >
                <LinkIcon className="h-3 w-3" />
                View File
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
