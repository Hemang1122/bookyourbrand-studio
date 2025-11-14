'use client';
import { useRef, useState } from 'react';
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

type ScrumExportDialogProps = {
  updates: ScrumUpdate[];
  users: User[];
  children: React.ReactNode;
};

export function ScrumExportDialog({ updates, users, children }: ScrumExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const getUpdatesForDate = (date: Date | undefined) => {
    if (!date) return [];
    return updates.filter(u => isSameDay(new Date(u.timestamp), date));
  };

  const handleDownloadPdf = async () => {
    const updatesForSelectedDate = getUpdatesForDate(selectedDate);
    if (updatesForSelectedDate.length === 0 || !selectedDate) {
      toast({ title: 'No updates to export', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    updatesForSelectedDate.forEach((update, index) => {
        const author = users.find(u => u.id === update.userId);
        if (!author) return;

        if (index > 0) {
            doc.addPage();
        }

        // Header section
        doc.setFillColor(54, 8, 120); // --primary color
        doc.rect(0, 0, pageWidth, 90, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text('BookYourBrands', margin, 55);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Daily Scrum Report', pageWidth - margin, 55, { align: 'right' });
        
        let y = 120;

        // Sub-header with author and date
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'bold');
        doc.text('Team Member:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        doc.text(author.name, margin + 85, y);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100);
        doc.text('Date:', pageWidth - margin - 150, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        doc.text(format(selectedDate, 'PPP'), pageWidth - margin - 110, y);

        y += 40;

        // Yesterday's Work
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

        // Today's Plan
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

        // Table using jspdf-autotable
        const tableData = (update.reels || []).map(reel => [
            reel.reelName,
            reel.duration,
            reel.issues,
            reel.remarks
        ]);

        (doc as any).autoTable({
            startY: y,
            head: [['Reel Name', 'Duration', 'Issues', 'Remarks']],
            body: tableData.length > 0 ? tableData : [['No specific reel data was submitted.', '', '', '']],
            theme: 'grid',
            headStyles: {
                fillColor: [54, 8, 120], // --primary color
                textColor: 255,
                fontStyle: 'bold',
            },
            styles: {
                cellPadding: 8,
                fontSize: 10,
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { left: margin, right: margin },
        });

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 30;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Report generated for ${author.name} on ${format(new Date(), 'PPpp')}`, pageWidth / 2, footerY, { align: 'center' });
    });


    doc.save(`scrum_report_${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    
    setIsLoading(false);
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    setIsLoading(false);
    setSelectedDate(new Date());
  };
  
  const updatesForSelectedDate = getUpdatesForDate(selectedDate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Export Scrum Updates</DialogTitle>
          <DialogDescription>
            Select a date to export the team's scrum updates as a PDF document.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 md:grid-cols-2">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </div>
          <div className="flex flex-col gap-4">
             <h3 className="font-semibold">
                Preview for {selectedDate ? format(selectedDate, 'PPP') : '...'}
             </h3>
            <ScrollArea className="h-72 w-full rounded-md border bg-muted/50">
              <div className="p-4 bg-background">
                {updatesForSelectedDate.length > 0 ? (
                    <div className="space-y-6">
                        {updatesForSelectedDate.map(update => {
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
                    <p className="text-center text-sm text-muted-foreground py-12">No updates for this date.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isLoading || updatesForSelectedDate.length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
