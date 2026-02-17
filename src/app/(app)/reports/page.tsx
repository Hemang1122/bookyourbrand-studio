'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TeamAnalytics } from './components/team-analytics';
import { ClientAnalytics } from './components/client-analytics';
import { useAuth } from '@/firebase/provider';
import { redirect } from 'next/navigation';
import { Users, Briefcase, Download, Loader2, BarChart3, IndianRupee, FolderKanban, CheckCircle, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from '../data-provider';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import type { User, TimerSession, PackageName, Project, Task, Client } from '@/lib/types';
import { packages } from '../settings/billing/packages-data';
import { OverviewChart } from '../dashboard/components/overview-chart';
import { cn } from '@/lib/utils';


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

    const kpis = [
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: '#10B981', change: '+12%' },
        { label: 'Total Clients', value: clients.length.toString(), icon: Users, color: '#7C3AED', change: '+8%' },
        { label: 'Total Projects', value: projects.length.toString(), icon: FolderKanban, color: '#3B82F6', change: '+24%' },
        { label: 'Completed Tasks', value: tasks.filter(t => t.status === 'Completed').length.toString(), icon: '#EC4899', change: '+18%' },
    ];
    
    const executiveSummary = `This report provides a comprehensive overview of BookYourBrands' performance, analyzing key metrics across revenue, client acquisition, and operational efficiency. The data highlights a strong growth trajectory and identifies key areas for strategic focus to maintain momentum.`;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(kpi => (
                    <div key={kpi.label} className="rounded-2xl p-5 bg-[#13131F] border border-white/5 hover:border-purple-500/20 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 rounded-xl" style={{ background: kpi.color + '20' }}>
                                <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">{kpi.change}</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{kpi.value}</p>
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl p-6 bg-[#13131F] border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                        <h3 className="font-semibold text-white">Task Status Overview</h3>
                        <p className="text-xs text-muted-foreground mt-1">Distribution of tasks by current status</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <OverviewChart tasks={tasks} />
                    </div>
                </div>

                <div className="rounded-2xl p-6 bg-[#13131F] border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-purple-500/10">
                            <FileText className="h-4 w-4 text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-white">Executive Summary</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{executiveSummary}</p>
                </div>
            </div>
        </div>
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

        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        const { default: html2canvas } = await import('html2canvas');

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
    
    const generateTeamClientReport = async () => {
        setIsDownloading(true);
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
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
            await generateTeamClientReport();
        }
    };
    
    const TABS = [
        { id: 'team-analytics', label: 'Team Analytics', icon: Users },
        { id: 'client-analytics', label: 'Client Analytics', icon: Briefcase },
        { id: 'business-analytics', label: 'Business Report', icon: BarChart3 }
    ];
    
    const quickStats = useMemo(() => {
        const totalRevenue = projects.reduce((acc, proj) => {
            const client = clients.find(c => c.id === proj.client.id);
            return acc + getPackagePrice(client?.packageName);
        }, 0);
        return [
            { label: 'Total Revenue', value: `₹${(totalRevenue/1000).toFixed(1)}k`, icon: IndianRupee, color: '#10B981' },
            { label: 'Total Clients', value: clients.length, icon: Users, color: '#7C3AED' },
            { label: 'Active Projects', value: projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length, icon: FolderKanban, color: '#3B82F6' },
            { label: 'Completed Tasks', value: tasks.filter(t => t.status === 'Completed').length, icon: CheckCircle, color: '#EC4899' },
        ];
    }, [projects, clients, tasks]);

    return (
        <div className="space-y-6">
             <div className="relative overflow-hidden rounded-2xl p-8 mb-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-purple-500 to-pink-500" />
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500">
                                <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white">Analytics Reports</h1>
                        </div>
                        <p className="text-muted-foreground ml-14">Insights into team performance and client activities</p>
                    </div>
                    <div className="flex items-center gap-3">
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
                        <Button onClick={handleDownload} disabled={isDownloading || isLoading} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {quickStats.map(stat => (
                    <div key={stat.label} className="rounded-xl p-4 bg-[#13131F] border border-white/5 flex items-center gap-4">
                        <div className="p-2 rounded-lg" style={{ background: stat.color + '20' }}>
                            <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

             <div className="flex gap-1 p-1 rounded-xl mb-8 bg-white/5 border border-white/5 w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AnalyticsTab)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            activeTab === tab.id
                            ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-purple-500/25"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    </button>
                ))}
            </div>

            <div>
                {activeTab === 'team-analytics' && <TeamAnalytics dateRange={dateRange} />}
                {activeTab === 'client-analytics' && <ClientAnalytics dateRange={dateRange} />}
                {activeTab === 'business-analytics' && <BusinessAnalytics tasks={tasks} projects={projects} clients={clients}/>}
            </div>
            
            <div className="absolute -left-[9999px] top-0 w-[800px] bg-background p-4">
                <div id="overview-chart-for-pdf">
                    <OverviewChart tasks={tasks} />
                </div>
            </div>
        </div>
    );
}
