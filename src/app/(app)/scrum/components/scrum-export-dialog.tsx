
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
import { Loader2, Calendar as CalendarIcon, Download } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  }

  const handleDownloadPdf = () => {
    if (reportContentRef.current) {
        setIsLoading(true);
      html2canvas(reportContentRef.current, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 15;
        pdf.setFontSize(20);
        pdf.text(`Scrum Report - ${format(selectedDate || new Date(), 'PPP')}`, pdfWidth / 2, 10, { align: 'center' });
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`scrum_report_${format(selectedDate || new Date(), 'yyyy-MM-dd')}.pdf`);
        setIsLoading(false);
        setOpen(false);
      });
    }
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
