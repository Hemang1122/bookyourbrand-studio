
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamAnalytics } from './components/team-analytics';
import { ClientAnalytics } from './components/client-analytics';
import { useAuth } from '@/firebase/provider';
import { redirect } from 'next/navigation';
import { Users, Briefcase, Download, Loader2, BarChart3 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from '../data-provider';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { User, TimerSession, PackageName, Project, Task, Client } from '@/lib/types';
import { packages } from '../settings/billing/packages-data';
import html2canvas from 'html2canvas';
import { OverviewChart } from '../dashboard/components/overview-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoginLogo } from '@/components/login-logo';


type AnalyticsTab = 'team-analytics' | 'client-analytics' | 'business-analytics';

const getPackagePrice = (packageName: PackageName | undefined): number => {
    if (!packageName) return 0;
    const pkg = packages.find(p => p.name === packageName);
    const tier = pkg?.tiers?.[0];
    if (!tier || !tier.price) return 0;
    return parseInt(tier.price.replace(/,/g, ''), 10);
};

const BusinessAnalytics = ({ tasks, projects, clients }: { tasks: Task[], projects: Project[], clients: Client[] }) => {
    const totalRevenue = useMemo(() => {
        return projects.reduce((acc, proj) => {
            const client = clients.find(c => c.id === proj.client.id);
            return acc + getPackagePrice(client?.packageName);
        }, 0);
    }, [projects, clients]);

    const kpis = {
        'Total Revenue': `₹${totalRevenue.toLocaleString('en-IN')}`,
        'Total Clients': clients.length,
        'Total Projects': projects.length,
        'Completed Tasks': tasks.filter(t => t.status === 'Completed').length,
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Business Report Preview</CardTitle>
                <CardDescription>A summary of the key sections that will be included in your detailed PDF report.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                 <div className="space-y-8">
                    <div className="p-8 rounded-lg bg-muted/50">
                        <h3 className="text-xl font-semibold mb-4">Executive Summary</h3>
                        <p className="text-muted-foreground">This report provides a comprehensive overview of BookYourBrands' performance, analyzing key metrics across revenue, client acquisition, and operational efficiency. The data highlights a strong growth trajectory and identifies key areas for strategic focus to maintain momentum.</p>
                    </div>
                     <div className="p-8 rounded-lg bg-muted/50">
                        <h3 className="text-xl font-semibold mb-4">Key Performance Indicators (KPIs)</h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            {Object.entries(kpis).map(([key, value]) => (
                                <div key={key} className="p-4 bg-background rounded-lg shadow">
                                    <p className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                    <p className="text-2xl font-bold">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="p-8 rounded-lg bg-muted/50">
                        <h3 className="text-xl font-semibold mb-4">Task Status Overview</h3>
                        <div className="h-[350px]">
                           <OverviewChart tasks={tasks} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


export default function ReportsPage() {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState<number>(30);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('team-analytics');
    const [isDownloading, setIsDownloading] = useState(false);
    
    const { teamMembers, tasks, clients, projects, timerSessions, isLoading } = useData();

    if (user?.role !== 'admin') {
        if (typeof window !== 'undefined') {
            redirect('/dashboard');
        }
        return null;
    }
    
    const generateBusinessReport = async () => {
        setIsDownloading(true);

        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 60;
        const year = new Date().getFullYear();

        const addPageHeader = (title: string, pageNum: number) => {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150);
            doc.text(`BookYourBrands | Business, Team & Client Analytics Report`, margin, 30);
            doc.text(`Page ${pageNum}`, pageWidth - margin, 30, { align: 'right' });
        }
        
        const addSectionTitle = (title: string, y: number) => {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(10, 26, 47); // Deep Blue
            doc.text(title, margin, y);
            y += 10;
            doc.setDrawColor(219, 165, 32); // Gold
            doc.setLineWidth(1.5);
            doc.line(margin, y, margin + 40, y);
            return y + 30;
        }

        // --- Page 1: Cover Page ---
        doc.setFillColor(10, 26, 47); // Deep Blue
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(255, 255, 255);
        doc.text('BookYourBrands', pageWidth / 2, pageHeight / 2 - 40, { align: 'center' });
        doc.setFontSize(18);
        doc.text('Business, Team & Client Analytics Report', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
        doc.setFontSize(12);
        doc.setTextColor(200, 200, 200);
        doc.text(`Annual Performance & Strategic Insights | ${year}`, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });


        // --- Page 2: Executive Summary ---
        doc.addPage();
        let currentPage = 2;
        addPageHeader("Executive Summary", currentPage);
        let y = 80;
        y = addSectionTitle("Executive Summary", y);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80);
        const summaryText = `This report provides a comprehensive overview of BookYourBrands' performance throughout ${year}. It analyzes key metrics across revenue, client acquisition, team productivity, and operational efficiency. The data highlights a strong growth trajectory and identifies key areas for strategic focus to maintain momentum and drive future success. Key wins include a significant increase in high-value clients and improved project turnaround times. Challenges remain in diversifying service offerings and managing seasonal workload fluctuations.`;
        const summaryLines = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 14 + 40;

        // --- Page 3: Business Analytics ---
        doc.addPage();
        currentPage++;
        addPageHeader("Business Analytics", currentPage);
        y = 80;
        y = addSectionTitle("Business Analytics", y);
        
        const totalRevenue = projects.reduce((acc, proj) => {
             const client = clients.find(c => c.id === proj.client.id);
             return acc + getPackagePrice(client?.packageName);
        }, 0);
        const kpiData = [
            ['Total Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`],
            ['Total Clients', clients.length.toString()],
            ['Total Projects', projects.length.toString()],
            ['Completed Tasks', tasks.filter(t => t.status === 'Completed').length.toString()]
        ];
        (doc as any).autoTable({
            startY: y,
            head: [['Key Performance Indicator', 'Value']],
            body: kpiData,
            theme: 'striped',
            headStyles: { fillColor: [10, 26, 47] },
        });
        y = (doc as any).lastAutoTable.finalY + 30;

        const overviewChartElement = document.getElementById('overview-chart-for-pdf');
        if (overviewChartElement) {
            const canvas = await html2canvas(overviewChartElement, { scale: 3, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
             if (y + imgHeight > pageHeight - margin) {
                doc.addPage();
                currentPage++;
                addPageHeader("Business Analytics", currentPage);
                y = 80;
            }
            doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 20;
        }

        // --- Page 4: Client Analytics ---
        doc.addPage();
        currentPage++;
        addPageHeader("Client Analytics", currentPage);
        y = 80;
        y = addSectionTitle("Client Analytics", y);
        
        const clientTableData = clients.map(client => {
            const clientProjects = projects.filter(p => p.client.id === client.id);
            const revenue = clientProjects.reduce((acc, p) => acc + getPackagePrice(client.packageName), 0);
            return [
                client.name,
                client.company,
                `₹${revenue.toLocaleString('en-IN')}`,
                clientProjects.length.toString()
            ];
        });
        (doc as any).autoTable({
            startY: y,
            head: [['Client Name', 'Company', 'Revenue Generated', 'Projects']],
            body: clientTableData,
            theme: 'grid',
            headStyles: { fillColor: [10, 26, 47] }
        });
        y = (doc as any).lastAutoTable.finalY + 40;


        // --- Page 5: Team Analytics ---
        doc.addPage();
        currentPage++;
        addPageHeader("Team Analytics", currentPage);
        y = 80;
        y = addSectionTitle("Team Analytics", y);
        const cutoffDate = subDays(new Date(), 30);
        const teamTableData = teamMembers.map(member => {
            const completedTasks = tasks.filter(t => t.assignedTo.id === member.id && t.status === 'Completed').length;
            const totalTime = (timerSessions || [])
                .filter(session => session.userId === member.id && isAfter(parseISO(session.date), cutoffDate))
                .reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0), 0);
            
            const formatTime = (ms: number) => {
                const hours = Math.floor(ms / 3600000);
                const minutes = Math.floor((ms % 3600000) / 60000);
                return `${hours}h ${minutes}m`;
            };

            return [
                member.name,
                member.role,
                completedTasks.toString(),
                formatTime(totalTime)
            ];
        });
        (doc as any).autoTable({
            startY: y,
            head: [['Team Member', 'Role', 'Tasks Completed (All Time)', 'Time Tracked (Last 30 Days)']],
            body: teamTableData,
            theme: 'grid',
            headStyles: { fillColor: [10, 26, 47] }
        });
        y = (doc as any).lastAutoTable.finalY + 40;

        // --- Page 6: Strategic Recommendations ---
        doc.addPage();
        currentPage++;
        addPageHeader("Strategic Recommendations", currentPage);
        y = 80;
        y = addSectionTitle("Strategic Recommendations", y);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const recommendations = [
            'Revenue Growth: Launch a premium "Advanced Editing" package to upsell existing high-value clients.',
            'Client Retention: Implement a quarterly business review for top-tier clients to enhance partnership and identify new opportunities.',
            'Team Efficiency: Allocate dedicated time for team members to cross-train on different editing software to increase flexibility and reduce bottlenecks.',
            'Operational Optimization: Develop standardized project templates within the CRM to accelerate the setup for common project types.'
        ];
        recommendations.forEach(rec => {
            const lines = doc.splitTextToSize(`•  ${rec}`, pageWidth - margin * 2 - 10);
            doc.text(lines, margin + 10, y);
            y += lines.length * 12 + 10;
        });

        // --- Final Page: Signature ---
        doc.addPage();
        currentPage++;
        addPageHeader("Signature", currentPage);
        y = pageHeight / 2;
        doc.setFont('times', 'italic');
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.text('Arpit Lalani', margin, y);
        doc.setDrawColor(150);
        doc.setLineWidth(1);
        doc.line(margin, y + 10, margin + 150, y + 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Founder & CEO, BookYourBrands', margin, y + 30);


        doc.save(`BookYourBrands_Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        setIsDownloading(false);
    };
    
    const generateTeamClientReport = () => {
        setIsDownloading(true);
        const doc = new jsPDF();
        const reportTitle = activeTab === 'team-analytics' ? 'Team Performance Report' : 'Client Activity Report';
        
        doc.setFontSize(10);
        doc.text('BookYourBrands', 14, 22);
        doc.setFontSize(16);
        doc.text(reportTitle, 14, 32);
        
        if (activeTab === 'team-analytics') {
             const cutoffDate = subDays(new Date(), dateRange);
             const teamData = teamMembers.map(member => {
                const completedTasks = tasks.filter(task => 
                    task.assignedTo.id === member.id &&
                    task.status === 'Completed' &&
                    task.remarks.some(r => r.toStatus === 'Completed' && new Date(r.timestamp) > cutoffDate)
                ).length;
                const totalTime = (timerSessions || [])
                    .filter(session => session.userId === member.id && new Date(session.date) > cutoffDate)
                    .reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0), 0);

                return [
                    member.name,
                    completedTasks.toString(),
                    `${Math.floor(totalTime / 3600000)}h ${Math.floor((totalTime % 3600000) / 60000)}m`
                ];
            });

            (doc as any).autoTable({
                startY: 40,
                head: [['Team Member', 'Tasks Completed', `Time Tracked (Last ${dateRange} Days)`]],
                body: teamData
            });

        } else if (activeTab === 'client-analytics') {
            const clientData = clients.map(client => {
                const clientProjects = projects.filter(p => p.client.id === client.id);
                const revenue = clientProjects.reduce((acc, p) => acc + getPackagePrice(client.packageName), 0);
                return [
                    client.name,
                    clientProjects.length.toString(),
                    `₹${revenue.toLocaleString('en-IN')}`
                ];
            });

            (doc as any).autoTable({
                startY: 40,
                head: [['Client', 'Projects Created', 'Total Revenue']],
                body: clientData
            });
        }
        
        doc.save(`${reportTitle.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        setIsDownloading(false);
    }


    const handleDownload = async () => {
        if (activeTab === 'business-analytics') {
            await generateBusinessReport();
        } else {
            generateTeamClientReport();
        }
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
                    {activeTab === 'team-analytics' && (
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
                    )}
                     <Button onClick={handleDownload} disabled={isDownloading || isLoading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="team-analytics" className="w-full" onValueChange={(value) => setActiveTab(value as AnalyticsTab)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="team-analytics">
                        <Users className="mr-2 h-4 w-4" />
                        Team Analytics
                    </TabsTrigger>
                    <TabsTrigger value="client-analytics">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Client Analytics
                    </TabsTrigger>
                    <TabsTrigger value="business-analytics">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Business Report
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="team-analytics">
                    <TeamAnalytics dateRange={dateRange} />
                </TabsContent>
                <TabsContent value="client-analytics">
                   <ClientAnalytics dateRange={dateRange} />
                </TabsContent>
                 <TabsContent value="business-analytics">
                   <BusinessAnalytics tasks={tasks} projects={projects} clients={clients}/>
                </TabsContent>
            </Tabs>
            
            {/* Hidden chart for PDF generation */}
            <div className="absolute -left-[9999px] top-0 w-[800px] bg-background p-4">
                <div id="overview-chart-for-pdf">
                    <OverviewChart tasks={tasks} />
                </div>
            </div>
        </div>
    );
}
