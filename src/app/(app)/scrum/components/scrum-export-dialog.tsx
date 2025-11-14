'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
    const updatesToExport = getUpdatesForSelection(selectedDate, selectedUserIds);
    if (updatesToExport.length === 0 || !selectedDate) {
      toast({ title: 'No updates to export for the current selection', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    
    updatesToExport.forEach((update, index) => {
        const author = users.find(u => u.id === update.userId);
        if (!author) return;

        if (index > 0) {
            doc.addPage();
        }

        doc.setFillColor(54, 8, 120);
        doc.rect(0, 0, pageWidth, 90, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text('BookYourBrands', margin, 55);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Daily Scrum Report', pageWidth - margin, 55, { align: 'right' });
        
        let y = 120;

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'bold');
        doc.text('Team Member:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        doc.text(author.name, margin + 95, y);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100);
        doc.text('Date:', pageWidth - margin - 150, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        doc.text(format(selectedDate, 'PPP'), pageWidth - margin, y, { align: 'right' });

        y += 40;

        if (update.yesterday) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(50);
            doc.text("Yesterday's Work", margin, y);
            y += 15;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(80);
            const yesterdayLines = doc.splitTextToSize(update.yesterday, pageWidth - margin * 2);
            doc.text(yesterdayLines, margin, y);
            y += yesterdayLines.length * 12 + 20;
        }

        if (update.today) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(50);
            doc.text("Today's Plan", margin, y);
            y += 15;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(80);
            const todayLines = doc.splitTextToSize(update.today, pageWidth - margin * 2);
            doc.text(todayLines, margin, y);
            y += todayLines.length * 12 + 20;
        }
        
        const tableData = (update.reels || []).map(reel => [
            reel.reelName,
            reel.duration,
            reel.issues,
            reel.remarks
        ]);

        if (tableData.length > 0) {
            (doc as any).autoTable({
                startY: y,
                head: [['Reel Name', 'Duration', 'Issues', 'Remarks']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [54, 8, 120],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                styles: { cellPadding: 8, fontSize: 10 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: margin, right: margin },
            });
        }

        const footerY = doc.internal.pageSize.getHeight() - 30;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Report generated on ${format(new Date(), 'PPp')}`, pageWidth / 2, footerY, { align: 'center' });
    });

    doc.save(`scrum_report_${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    
    setIsLoading(false);
    setOpen(false);
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
