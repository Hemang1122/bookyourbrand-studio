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
import type { ScrumUpdate, User } from '@/lib/types';
import { useData } from '../../data-provider';

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
    const margin = 60;
    const contentWidth = pageWidth - margin * 2;
    
    const drawLetterhead = () => {
        // Draw border
        doc.setDrawColor(0);
        doc.setLineWidth(1.5);
        doc.rect(20, 20, pageWidth - 40, pageHeight - 40);

        // Add "BookYourBrands" Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text("BookYourBrands", pageWidth / 2, 70, { align: 'center' });

        // Add a line under the title
        doc.setLineWidth(0.5);
        doc.line(margin, 90, pageWidth - margin, 90);
    }

    updatesForSelectedDate.forEach((update, index) => {
        const author = users.find(u => u.id === update.userId);
        if (!author) return;

        if (index > 0) {
            doc.addPage();
        }

        drawLetterhead();
        
        let y = 120; 

        // --- Report Header ---
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        doc.setFont('helvetica', 'bold');
        doc.text(`Date:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${format(selectedDate, 'PPP')}`, margin + 80, y);
        y += 15;

        doc.setFont('helvetica', 'bold');
        doc.text(`Project Name:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`General Update`, margin + 80, y);
        y += 15;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Team Members:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(author.name, margin + 80, y);
        y += 30;

        // --- Report Body ---
        const addSection = (title: string, content: string) => {
            if (y > pageHeight - 150) { // Check if new page is needed
                doc.addPage();
                drawLetterhead();
                y = 120;
            }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(title.toUpperCase(), margin, y);
            y += 20;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(content || "N/A", contentWidth);
            const bulletedLines = lines.map((line: string) => line.trim().startsWith('-') ? line : `- ${line}`);
            
            bulletedLines.forEach((line: string) => {
                 if (y > pageHeight - 80) { // Check before printing each line
                    doc.addPage();
                    drawLetterhead();
                    y = 120;
                 }
                 doc.text(line, margin, y);
                 y += 15;
            });
            y += 15; // Extra space after section
        };

        addSection("1. TASKS COMPLETED YESTERDAY:", update.yesterday);
        addSection("2. TASKS PLANNED FOR TODAY:", update.today);
        addSection("3. BLOCKERS / ISSUES:", "None reported.");
        addSection("4. NOTES / UPDATES:", "All tasks are on track.");

        // --- Signature ---
        y = pageHeight - 140; // Position signature block towards the bottom
        doc.setFont('helvetica', 'normal');
        doc.text(`Reported by: ${author.name}`, margin, y);
        y += 20;
        doc.text(`Position: ${author.role}`, margin, y);
        y += 20;
        doc.text("Signature: _______________________", margin, y);
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
                                        <div>
                                            <p className="font-semibold text-xs text-muted-foreground">Yesterday</p>
                                            <p className="text-sm whitespace-pre-line">{update.yesterday}</p>
                                        </div>
                                         <div>
                                            <p className="font-semibold text-xs text-muted-foreground">Today</p>
                                            <p className="text-sm whitespace-pre-line">{update.today}</p>
                                        </div>
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
