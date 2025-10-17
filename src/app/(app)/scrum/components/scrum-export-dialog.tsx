
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  const reportContentRef = useRef<HTMLDivElement>(null);

  const getUpdatesForDate = (date: Date | undefined) => {
    if (!date) return [];
    return updates.filter(u => isSameDay(new Date(u.timestamp), date));
  };

  const handleDownloadPdf = () => {
    const updatesForSelectedDate = getUpdatesForDate(selectedDate);
    if (updatesForSelectedDate.length === 0 || !selectedDate) {
      toast({ title: 'No updates to export', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 40;

    updatesForSelectedDate.forEach((update, index) => {
      const author = users.find(u => u.id === update.userId);
      if (!author) return;

      if (index > 0) {
        doc.addPage();
      }

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('BookYourBrands - Arpit Lalani', margin, margin);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Scrum Report: ${format(selectedDate, 'PPP')}`, margin, margin + 20);
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, margin + 30, pageWidth - margin, margin + 30);

      let y = margin + 70;

      // Content
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(`Team Member: ${author.name}`, margin, y);
      y += 30;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("Yesterday's Accomplishments:", margin, y);
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const yesterdayLines = doc.splitTextToSize(update.yesterday, pageWidth - margin * 2);
      doc.text(yesterdayLines, margin, y);
      y += yesterdayLines.length * 14 + 20;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("Today's Goals:", margin, y);
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const todayLines = doc.splitTextToSize(update.today, pageWidth - margin * 2);
      doc.text(todayLines, margin, y);

      // Footer
      const footerY = pageHeight - margin - 40;
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Shop No 14, Vishwakarma Nagar building. 03 60 feet road, Landmark:, opposite old swaminarayan temple, Vasai West, Vasai-Virar, Maharashtra 401202', margin, footerY + 15);
      doc.text('bookyourbrands.com', margin, footerY + 25);
      doc.setDrawColor(150, 150, 150);
      doc.setLineDash([2, 2], 0);
      doc.rect(pageWidth - margin - 100, footerY - 50, 80, 40); // Signature box
      doc.text('Signed', pageWidth - margin - 60, footerY - 25);

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
              <div ref={reportContentRef} className="p-4 bg-background">
                {updatesForSelectedDate.length > 0 ? (
                    <div className="space-y-6">
                        {updatesForSelectedDate.map(update => {
                            const author = users.find(u => u.id === update.userId);
                            const avatar = PlaceHolderImages.find(img => img.id === author?.avatar);
                            if (!author) return null;

                            return (
                                <div key={update.id} className="grid grid-cols-[auto_1fr] gap-x-4">
                                    <Avatar>
                                        <AvatarImage src={avatar?.imageUrl} alt={author.name} data-ai-hint={avatar?.imageHint} />
                                        <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
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
