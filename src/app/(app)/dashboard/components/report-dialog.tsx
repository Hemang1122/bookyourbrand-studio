
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimerSession, User } from '@/lib/types';


type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: TimerSession[];
  totalTime: number;
  reportDate: Date;
  user: User; // The user for whom the report is being generated
};

export function ReportDialog({ open, onOpenChange, sessions, totalTime, reportDate, user }: ReportDialogProps) {
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 60;
    let y = 0;
    const addressLines = [
      'Shop No 14, Vishwakarma Nagar building. 03',
      '60 feet road, Landmark:, opposite old swaminarayan temple,',
      'Vasai West, Vasai-Virar, Maharashtra 401202',
    ];

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('BookYourBrands', margin, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    addressLines.forEach((line, index) => {
      doc.text(line, margin, 75 + (index * 12));
    });
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
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
    doc.text(format(reportDate, 'PPP'), pageWidth / 2, y);
    doc.text(formatTime(totalTime), pageWidth - margin, y, { align: 'right' });
    y += 40;

    // --- Table Header ---
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, y, pageWidth - margin*2, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text('SESSION NAME / DESCRIPTION', margin + 15, y + 20);
    doc.text('START TIME', margin + 250, y + 20);
    doc.text('END TIME', margin + 350, y + 20);
    doc.text('DURATION', pageWidth - margin - 15, y + 20, { align: 'right' });
    y += 45;

    // --- Table Content ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(22, 22, 22);
    sessions.forEach((session) => {
        if (y > doc.internal.pageSize.getHeight() - 150) { // Adjusted for footer space
            doc.addPage();
            y = margin;
        }
        const duration = session.endTime ? session.endTime - session.startTime : 0;
        doc.text(session.name || 'Untitled Session', margin + 15, y, { maxWidth: 220 });
        doc.text(format(new Date(session.startTime), 'p'), margin + 250, y);
        doc.text(session.endTime ? format(new Date(session.endTime), 'p') : 'Running', margin + 350, y);
        doc.text(formatTime(duration), pageWidth - margin - 15, y, { align: 'right' });
        y += 25;
    });

     // --- Footer ---
    const footerY = doc.internal.pageSize.getHeight() - 100;
    doc.setLineWidth(0.5);
    doc.setDrawColor(220);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('times', 'italic');
    doc.setFontSize(16);
    doc.text('Preeti Lalani', pageWidth - margin, footerY - 20, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Founder & CEO, BookYourBrands', pageWidth - margin, footerY - 5, { align: 'right' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This is a computer-generated daily work report. All recorded times are based on user-initiated timer actions.', pageWidth / 2, footerY + 20, { align: 'center' });


    doc.save(`timesheet_${user.name.replace(/\s/g, '_')}_${format(reportDate, 'yyyy-MM-dd')}.pdf`);
    
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate Daily Work Report</DialogTitle>
          <DialogDescription>
            This will generate a formal PDF document summarizing all tracked work sessions for {format(reportDate, 'PPP')}. Please review the details before downloading.
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 space-y-4">
            <Card className="bg-muted/50">
                <CardHeader>
                     <CardTitle className="text-lg">Activity Summary for {format(reportDate, 'PPP')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center justify-between rounded-lg bg-background p-4 shadow-inner">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Time Tracked</p>
                            <p className="text-2xl font-bold font-mono text-primary">{formatTime(totalTime)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Sessions Logged</p>
                            <p className="text-2xl font-bold text-center">{sessions.length}</p>
                        </div>
                    </div>
                     <h4 className="mb-2 font-medium">Logged Sessions Breakdown</h4>
                     <div className="max-h-60 overflow-y-auto rounded-md border">
                        {sessions.map((session) => {
                            const duration = session.endTime ? session.endTime - session.startTime : 0;
                            return (
                                <div key={session.id} className="flex justify-between p-3 border-b last:border-b-0 items-center bg-background">
                                    <span className="font-semibold text-sm flex-1 truncate pr-2">{session.name || 'Untitled Session'}</span>
                                    <span className="text-sm text-muted-foreground hidden sm:inline">
                                        {format(new Date(session.startTime), 'p')} - {session.endTime ? format(new Date(session.endTime), 'p') : '...'}
                                    </span>
                                    <span className="text-sm font-mono w-24 text-right">{formatTime(duration)}</span>
                                </div>
                            )
                        })}
                        {sessions.length === 0 && (
                            <p className="p-4 text-center text-sm text-muted-foreground">No sessions were logged for this date.</p>
                        )}
                     </div>
                </CardContent>
            </Card>
            <Button onClick={handleDownloadPdf} disabled={isLoading || sessions.length === 0} className="w-full" size="lg">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                Download Timesheet PDF
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
