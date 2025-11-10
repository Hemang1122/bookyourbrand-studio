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
} from '@/components/ui/dialog';
import { Loader2, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '@/firebase/provider';
import { format } from 'date-fns';

interface TimerSession {
  startTime: number;
  endTime: number | null;
}

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: TimerSession[];
  totalTime: number;
};

export function ReportDialog({ open, onOpenChange, sessions, totalTime }: ReportDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const formatTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleDownloadPdf = () => {
    if (!user) return;
    setIsLoading(true);

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 60;
    let y = 0;

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('BookYourBrands', margin, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Daily Work Report', margin, 80);
    
    doc.setFontSize(28);
    doc.setTextColor(22, 22, 22);
    doc.text('TIMESHEET', pageWidth - margin, 60, { align: 'right' });
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
    doc.text('TOTAL HOURS', pageWidth - margin, y, { align: 'right' });
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(22, 22, 22);
    doc.text(user.name, margin, y);
    doc.text(format(new Date(), 'PPP'), pageWidth / 2, y);
    doc.text(formatTime(totalTime), pageWidth - margin, y, { align: 'right' });
    y += 40;

    // --- Table Header ---
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, y, pageWidth - margin*2, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SESSION', margin + 15, y + 20);
    doc.text('START TIME', margin + 150, y + 20);
    doc.text('END TIME', margin + 300, y + 20);
    doc.text('DURATION', pageWidth - margin - 15, y + 20, { align: 'right' });
    y += 45;

    // --- Table Content ---
    doc.setFont('helvetica', 'normal');
    sessions.forEach((session, index) => {
        if (y > doc.internal.pageSize.getHeight() - 100) {
            doc.addPage();
            y = margin;
        }
        const duration = session.endTime ? session.endTime - session.startTime : 0;
        doc.text(`${index + 1}`, margin + 15, y);
        doc.text(format(new Date(session.startTime), 'p'), margin + 150, y);
        doc.text(session.endTime ? format(new Date(session.endTime), 'p') : 'Running', margin + 300, y);
        doc.text(formatTime(duration), pageWidth - margin - 15, y, { align: 'right' });
        y += 20;
    });

     // --- Footer ---
    const footerY = doc.internal.pageSize.getHeight() - 60;
    doc.setLineWidth(1);
    doc.setDrawColor(220);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This is a computer-generated report.', pageWidth / 2, footerY + 20, { align: 'center' });


    doc.save(`timesheet_${user.name.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Submit Daily Report</DialogTitle>
          <DialogDescription>
            Review your tracked time for today and download the PDF report.
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 space-y-4">
            <Card className="bg-muted/50">
                <CardHeader>
                     <CardTitle className="text-lg">Today's Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center justify-between rounded-lg bg-background p-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Time</p>
                            <p className="text-2xl font-bold">{formatTime(totalTime)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Sessions Logged</p>
                            <p className="text-2xl font-bold">{sessions.length}</p>
                        </div>
                    </div>
                     <h4 className="mb-2 font-medium">Logged Sessions</h4>
                     <div className="max-h-60 overflow-y-auto rounded-md border">
                        {sessions.map((session, index) => {
                            const duration = session.endTime ? session.endTime - session.startTime : 0;
                            return (
                                <div key={index} className="flex justify-between p-3 border-b last:border-b-0">
                                    <span className="font-semibold text-sm">Session {index + 1}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {format(new Date(session.startTime), 'p')} - {session.endTime ? format(new Date(session.endTime), 'p') : '...'}
                                    </span>
                                    <span className="text-sm font-mono">{formatTime(duration)}</span>
                                </div>
                            )
                        })}
                     </div>
                </CardContent>
            </Card>
            <Button onClick={handleDownloadPdf} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                Download and Submit PDF
            </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
