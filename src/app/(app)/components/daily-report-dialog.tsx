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
import { generateActivityReport } from '@/ai/flows/generate-activity-report';
import { Bot, Loader2, Calendar as CalendarIcon, Download } from 'lucide-react';
import { useData } from '../data-provider';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


type DailyReportDialogProps = {
  children: React.ReactNode;
};

export function DailyReportDialog({ children }: DailyReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const { projects, tasks, users } = useData();
  const reportContentRef = useRef<HTMLDivElement>(null);

  const handleGenerateReport = async () => {
    if (!selectedDate) {
      toast({ title: 'Error', description: 'Please select a date.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setReport(null);
    try {
      const input = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        projects,
        tasks,
        users,
      };
      const result = await generateActivityReport(input);
      setReport(result.report);
    } catch (error) {
      console.error(error);
      toast({ title: 'AI Error', description: 'Failed to generate the report.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (reportContentRef.current) {
      html2canvas(reportContentRef.current).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 30;
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`daily_report_${format(selectedDate || new Date(), 'yyyy-MM-dd')}.pdf`);
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setReport(null);
    setIsLoading(false);
    setSelectedDate(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Daily Activity Report
          </DialogTitle>
          <DialogDescription>
            Select a date to generate an AI-powered summary of all project activities.
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
             <Button onClick={handleGenerateReport} disabled={isLoading || !selectedDate} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                Generate for {selectedDate ? format(selectedDate, 'PPP') : '...'}
            </Button>
            <ScrollArea className="h-72 w-full rounded-md border bg-muted/50 p-4">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {report ? (
                 <div
                    id="report-content"
                    ref={reportContentRef}
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br />') }}
                  />
              ) : (
                !isLoading && <p className="text-center text-sm text-muted-foreground">Your report will appear here.</p>
              )}
            </ScrollArea>
             <Button onClick={handleDownloadPdf} disabled={!report || isLoading} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
