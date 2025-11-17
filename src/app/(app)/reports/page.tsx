
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamAnalytics } from './components/team-analytics';
import { ClientAnalytics } from './components/client-analytics';
import { useAuth } from '@/firebase/provider';
import { redirect } from 'next/navigation';
import { Users, Briefcase, Download, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from '../data-provider';
import { format, subDays, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { User, TimerSession } from '@/lib/types';
import { packages } from '../settings/billing/packages-data';


type AnalyticsTab = 'team-analytics' | 'client-analytics';

// Helper to get a value from localStorage, keyed by user ID
const getLocalStorage = (key: string, userId: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue;
    const userKey = `${key}_${userId}`;
    const storedValue = window.localStorage.getItem(userKey);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
};


export default function ReportsPage() {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState<number>(7);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('team-analytics');
    const [isDownloading, setIsDownloading] = useState(false);
    
    const { teamMembers, tasks, clients, projects } = useData();

    if (user?.role !== 'admin') {
        if (typeof window !== 'undefined') {
            redirect('/dashboard');
        }
        return null;
    }

    const generatePdfHeader = (doc: jsPDF, title: string) => {
        const addressLines = [
            'Shop No 14, Vishwakarma Nagar building. 03',
            '60 feet road, Landmark:, opposite old swaminarayan temple,',
            'Vasai West, Vasai-Virar, Maharashtra 401202',
        ];
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text('BookYourBrands', 40, 60);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        addressLines.forEach((line, index) => {
            doc.text(line, 40, 75 + (index * 12));
        });

        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 22, 22);
        doc.text(title.toUpperCase(), doc.internal.pageSize.getWidth() - 40, 105, { align: 'right' });
    };

    const handleDownload = () => {
        setIsDownloading(true);

        const doc = new jsPDF();
        const dateRangeText = `Last ${dateRange} Days`;

        if (activeTab === 'team-analytics') {
            generatePdfHeader(doc, 'Team Report');
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(dateRangeText, 40, 140);
            
            const cutoffDate = subDays(new Date(), dateRange);
            const data = teamMembers.map(member => {
                const completedTasks = tasks.filter(task => {
                    const remark = task.remarks.find(r => r.toStatus === 'Completed');
                    if (task.assignedTo.id === member.id && remark) {
                        return parseISO(remark.timestamp) > cutoffDate;
                    }
                    return false;
                }).length;
                
                const allSessions: TimerSession[] = getLocalStorage('timerAllSessions', member.id, []);
                const totalTime = allSessions
                    .filter(session => parseISO(session.date) > cutoffDate)
                    .reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0), 0);
                const timeFormatted = `${Math.floor(totalTime / 3600000)}h ${Math.floor((totalTime % 3600000) / 60000)}m`;

                return [member.name, member.email, completedTasks.toString(), timeFormatted];
            }).sort((a, b) => parseInt(b[2]) - parseInt(a[2]));

            (doc as any).autoTable({
                startY: 160,
                head: [['Name', 'Email', 'Tasks Completed', 'Time Tracked']],
                body: data,
                theme: 'striped',
                headStyles: { fillColor: [75, 0, 130] }, // Deep Indigo
            });

        } else if (activeTab === 'client-analytics') {
            generatePdfHeader(doc, 'Client Report');
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text('All-Time Data', 40, 140);

            const getPackagePrice = (packageName: any) => {
                const pkg = packages.find(p => p.name === packageName);
                const tier = pkg?.tiers?.[0];
                return tier ? parseInt(tier.price.replace(/,/g, '')) : 0;
            };

            const data = clients.map(client => {
                const clientProjects = projects.filter(p => p.client.id === client.id);
                const revenue = getPackagePrice(client.packageName) * clientProjects.length;
                return [client.name, client.company, clientProjects.length.toString(), `₹${revenue.toLocaleString('en-IN')}`];
            }).sort((a, b) => parseFloat(b[3].replace(/[^0-9]/g, '')) - parseFloat(a[3].replace(/[^0-9]/g, '')));

            (doc as any).autoTable({
                startY: 160,
                head: [['Name', 'Company', 'Projects Created', 'Total Revenue']],
                body: data,
                theme: 'striped',
                headStyles: { fillColor: [75, 0, 130] }, // Deep Indigo
            });
        }
        
        doc.save(`${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        setIsDownloading(false);
    };

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics Reports</h2>
                    <p className="text-muted-foreground">
                        Insights into team performance and client activities.
                    </p>
                </div>
                 <div className="flex items-center gap-2">
                    <Select value={String(dateRange)} onValueChange={(value) => setDateRange(Number(value))}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                     <Button onClick={handleDownload} disabled={isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="team-analytics" className="w-full" onValueChange={(value) => setActiveTab(value as AnalyticsTab)}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="team-analytics">
                        <Users className="mr-2 h-4 w-4" />
                        Team Analytics
                    </TabsTrigger>
                    <TabsTrigger value="client-analytics">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Client Analytics
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="team-analytics">
                    <TeamAnalytics dateRange={dateRange} />
                </TabsContent>
                <TabsContent value="client-analytics">
                   <ClientAnalytics dateRange={dateRange} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
