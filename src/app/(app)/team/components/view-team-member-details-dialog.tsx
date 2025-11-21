'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { User, TimerSession } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { ReportDialog } from '../../dashboard/components/report-dialog';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useData } from '../../data-provider';


type ViewTeamMemberDetailsDialogProps = {
  teamMember: User;
  children: React.ReactNode;
};

export function ViewTeamMemberDetailsDialog({ teamMember, children }: ViewTeamMemberDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { timerSessions } = useData();
  
  const sessionsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return timerSessions.filter(s => s.userId === teamMember.id && s.date === dateStr);
  }, [selectedDate, timerSessions, teamMember.id]);

  const totalTimeForSelectedDate = sessionsForSelectedDate.reduce((total, session) => {
    return total + (session.endTime ? session.endTime - session.startTime : 0);
  }, 0);


  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Team Member Details: {teamMember.name}</DialogTitle>
            <DialogDescription>Viewing details and tracked work sessions for {teamMember.email}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p>{teamMember.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{teamMember.email}</p>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Role</div>
              <div><Badge variant={teamMember.role === 'admin' ? 'default' : 'secondary'}>{teamMember.role}</Badge></div>
            </div>
            <div className="space-y-4 rounded-md border p-4">
                <h4 className="font-medium">Work Session History</h4>
                <div className='flex justify-center'>
                     <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                    />
                </div>
                <Button 
                    className="w-full"
                    onClick={() => setIsReportOpen(true)}
                    disabled={sessionsForSelectedDate.length === 0}
                >
                    <Download className="mr-2 h-4 w-4" /> Download Report for {selectedDate ? format(selectedDate, 'PPP') : '...'}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {selectedDate && (
         <ReportDialog
            open={isReportOpen}
            onOpenChange={setIsReportOpen}
            sessions={sessionsForSelectedDate}
            totalTime={totalTimeForSelectedDate}
            reportDate={selectedDate}
        />
      )}
    </>
  );
}
