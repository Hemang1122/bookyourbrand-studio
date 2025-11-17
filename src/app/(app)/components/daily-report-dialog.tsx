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
        messages: [], // Messages are no longer globally available
      };
      const result = await generateActivityReport(input);
      // Basic markdown to HTML
      const htmlReport = result.report
        .replace(/### (.*)/g, '<h3 class="font-semibold text-lg mt-4 mb-2">$1</h3>')
        .replace(/## (.*)/g, '<h2 class="font-bold text-xl mt-6 mb-3 border-b pb-2">$1</h2>')
        .replace(/# (.*)/g, '<h1 class="font-extrabold text-2xl mt-8 mb-4">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');

      setReport(htmlReport);
    } catch (error) {
      console.error(error);
      toast({ title: 'AI Error', description: 'Failed to generate the report.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const reportNode = reportContentRef.current;
    if (reportNode) {
      // Temporarily increase width for better canvas capture
      reportNode.style.width = '1000px';

      html2canvas(reportNode, { scale: 2 }).then((canvas) => {
         reportNode.style.width = ''; // Reset style

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const ratio = canvasWidth / canvasHeight;
        let imgWidth = pdfWidth - 20; // with margin
        let imgHeight = imgWidth / ratio;
        
        let heightLeft = imgHeight;
        let position = 10; // top margin

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[725px] md:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Daily Activity Report
          </DialogTitle>
          <DialogDescription>
            Select a date to generate an AI-powered summary of all project activities.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 md:grid-cols-2 flex-1 min-h-0">
          <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              <Button onClick={handleGenerateReport} disabled={isLoading || !selectedDate} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                Generate for {selectedDate ? format(selectedDate, 'PPP') : '...'}
            </Button>
          </div>

          <div className="flex flex-col gap-4 min-h-0">
             <h3 className="font-semibold text-lg">Generated Report</h3>
            <ScrollArea className="flex-1 w-full rounded-md border bg-muted/50">
                <div className='p-4'>
                {isLoading && (
                    <div className="flex items-center justify-center h-full min-h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {report ? (
                    <div
                        id="report-content"
                        ref={reportContentRef}
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: report }}
                    />
                ) : (
                    !isLoading && <p className="text-center text-sm text-muted-foreground pt-12">Your report will appear here.</p>
                )}
                </div>
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
