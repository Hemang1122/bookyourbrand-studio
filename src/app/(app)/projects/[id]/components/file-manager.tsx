'use client';

import { useState } from 'react';
import type { ProjectFile } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';

type FileManagerProps = {
  initialFiles: ProjectFile[];
};

export function FileManager({ initialFiles }: FileManagerProps) {
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles);

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
            </Button>
        </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40%]'>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => {
              const userAvatar = PlaceHolderImages.find(img => img.id === file.uploadedBy.avatar);
              return (
                <TableRow key={file.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    {file.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{file.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                         <Avatar className="h-6 w-6">
                            <AvatarImage src={userAvatar?.imageUrl} alt={file.uploadedBy.name} data-ai-hint={userAvatar?.imageHint} />
                            <AvatarFallback>{file.uploadedBy.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{file.uploadedBy.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{file.uploadedAt}</TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
             {files.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No files uploaded yet.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
