'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

interface NASFileUploadProps {
  clientName: string;
  projectId: string;
  onUploadComplete?: (url: string) => void;
}

export function NASFileUpload({ clientName, projectId, onUploadComplete }: NASFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

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

      const response = await fetch('/api/upload-to-nas', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: `File uploaded: ${data.fileName}`,
          url: data.shareUrl
        });
        
        if (onUploadComplete && data.shareUrl) {
          onUploadComplete(data.shareUrl);
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
        <div className="flex-1 relative">
          <Input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="bg-black/20 border-white/10 text-white"
          />
          {uploading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2",
          result.success ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
        )}>
          {result.success ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{result.message}</p>
          </div>
          
          {result.url && (
            <Button size="sm" variant="ghost" className="h-8 text-green-400 hover:text-green-300 hover:bg-green-500/10" asChild>
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View File
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}