'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ScrumUpdate, User } from '@/lib/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { Label } from '@/components/ui/label';

type ScrumExportDialogProps = {
  updates: ScrumUpdate[];
  users: User[];
  children: React.ReactNode;
};

export function ScrumExportDialog({ updates, users, children }: ScrumExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { toast } = useToast();

  const teamMemberOptions = useMemo(() => {
    return users
      .filter(u => u.role === 'team' || u.role === 'admin')
      .map(u => ({ value: u.id, label: u.name }));
  }, [users]);
  
  const getUpdatesForSelection = (date: Date | undefined, userIds: string[]) => {
    if (!date) return [];
    
    let filteredUpdates = updates.filter(u => isSameDay(new Date(u.timestamp), date));
    
    if (userIds.length > 0) {
      filteredUpdates = filteredUpdates.filter(u => userIds.includes(u.userId));
    }
    
    return filteredUpdates;
  };

  useEffect(() => {
    if (open && selectedDate) {
        const usersWithUpdates = updates
            .filter(u => isSameDay(new Date(u.timestamp), selectedDate))
            .map(u => u.userId);
        const uniqueUserIds = [...new Set(usersWithUpdates)];
        setSelectedUserIds(uniqueUserIds);
    }
  }, [open, selectedDate, updates]);

 const handleDownloadPdf = async () => {
    setIsLoading(true);
    try {
        const { default: jsPDF } = await import('jspdf');
        // We are NOT using autotable anymore
        // const { default: autoTable } = await import('jspdf-autotable');

        const updatesToExport = getUpdatesForSelection(selectedDate, selectedUserIds);
        if (updatesToExport.length === 0 || !selectedDate) {
            toast({ title: 'No updates to export for the current selection', variant: 'destructive' });
            setIsLoading(false);
            return;
        }
      
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        const addressLines = [
            'Shop No 14, Vishwakarma Nagar building. 03',
            '60 feet road, Landmark:, opposite old swaminarayan temple,',
            'Vasai West, Vasai-Virar, Maharashtra 401202',
        ];

        updatesToExport.forEach((update, index) => {
            const author = users.find(u => u.id === update.userId);
            if (!author) return;

            if (index > 0) doc.addPage();
            let y = 0;

            // --- Header ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.text('BookYourBrands', margin, 60);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(100);
            addressLines.forEach((line, i) => {
                doc.text(line, margin, 75 + (i * 12));
            });
            
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 22, 22);
            doc.text('SCRUM REPORT', pageWidth - margin, 60, { align: 'right' });
            y = 120;
            doc.setLineWidth(1);
            doc.setDrawColor(240);
            doc.line(margin, y, pageWidth - margin, y);
            y += 30;

            // --- Details ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text('TEAM MEMBER', margin, y);
            
            doc.setFontSize(10);
            doc.text('DATE', pageWidth / 2, y);
            y += 20;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(22, 22, 22);
            doc.text(author.name, margin, y);
            doc.text(format(selectedDate, 'PPP'), pageWidth / 2, y);
            y += 40;
            
            const drawSection = (title: string, content: string | undefined) => {
                if (!content) return;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(50);
                doc.text(title, margin, y);
                y += 18;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(80);
                const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
                doc.text(lines, margin, y);
                y += lines.length * 12 + 25;
            }

            drawSection("Yesterday's Work", update.yesterday);
            drawSection("Today's Plan", update.today);

            // --- Table for Reels ---
            if (update.reels && update.reels.length > 0) {
                // Table Header
                doc.setFillColor(248, 248, 248);
                doc.rect(margin, y, pageWidth - margin * 2, 25, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(50);
                const headers = ['Reel Name', 'Duration', 'Issues', 'Remarks'];
                const colWidths = [180, 80, 100, 150];
                let currentX = margin + 10;
                headers.forEach((header, i) => {
                    doc.text(header, currentX, y + 18);
                    currentX += colWidths[i];
                });
                y += 35;

                // Table Body
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(22, 22, 22);

                update.reels.forEach(reel => {
                    if (y > doc.internal.pageSize.getHeight() - 100) {
                        doc.addPage();
                        y = margin;
                    }
                    const reelData = [reel.reelName || '-', reel.duration || '-', reel.issues || '-', reel.remarks || '-'];
                    const lineHeights = reelData.map((txt, i) => doc.splitTextToSize(txt, colWidths[i] - 10).length);
                    const maxLines = Math.max(...lineHeights);

                    let cellX = margin + 10;
                    reelData.forEach((text, i) => {
                        doc.text(doc.splitTextToSize(text, colWidths[i] - 10), cellX, y);
                        cellX += colWidths[i];
                    });

                    y += maxLines * 11 + 10;
                    doc.setDrawColor(240);
                    doc.line(margin, y - 5, pageWidth - margin, y - 5);
                });
            }
        });
      
      doc.save(`scrum_report_${format(selectedDate!, 'yyyy-MM-dd')}.pdf`);

    } catch (err) {
      console.error("PDF ERROR:", err);
      toast({ title: 'PDF Export Failed', description: 'There was an error creating the PDF.', variant: 'destructive'});
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };


  const handleClose = () => {
    setOpen(false);
    setIsLoading(false);
    setSelectedDate(new Date());
    setSelectedUserIds([]);
  };
  
  const updatesForPreview = getUpdatesForSelection(selectedDate, selectedUserIds);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Export Scrum Updates</DialogTitle>
          <DialogDescription>
            Select a date and team members to export scrum updates as a PDF document.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 md:grid-cols-2">
            <div className='space-y-4'>
                <div className="space-y-2">
                    <Label>Date</Label>
                    <div className="flex justify-center">
                        <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Team Members</Label>
                     <MultiSelect
                        options={teamMemberOptions}
                        selected={selectedUserIds}
                        onChange={setSelectedUserIds}
                        placeholder="Select members (defaults to all)"
                        className="w-full"
                    />
                </div>
            </div>
          <div className="flex flex-col gap-4">
             <h3 className="font-semibold">
                Preview for {selectedDate ? format(selectedDate, 'PPP') : '...'} ({updatesForPreview.length})
             </h3>
            <ScrollArea className="h-96 w-full rounded-md border bg-muted/50">
              <div className="p-4 bg-background">
                {updatesForPreview.length > 0 ? (
                    <div className="space-y-6">
                        {updatesForPreview.map(update => {
                            const author = users.find(u => u.id === update.userId);
                            if (!author) return null;

                            return (
                                <div key={update.id} className="flex gap-4">
                                    <div className='space-y-2'>
                                        <p className="font-bold text-sm">{author.name}</p>
                                        {(update.reels && update.reels.length > 0) ? (
                                           <ul className="list-disc list-inside space-y-1 pl-2">
                                            {update.reels.map((reel, index) => (
                                              <li key={index} className="text-sm">
                                                <strong>{reel.reelName}</strong> ({reel.duration}): {reel.remarks || 'No remarks.'}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No reel-specific updates submitted.</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-center text-sm text-muted-foreground py-12">No updates for the selected criteria.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isLoading || updatesForPreview.length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
