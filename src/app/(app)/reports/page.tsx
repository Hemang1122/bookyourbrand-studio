'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TeamAnalytics } from './components/team-analytics';
import { ClientAnalytics } from './components/client-analytics';
import { useAuth } from '@/firebase/provider';
import { redirect } from 'next/navigation';
import { Users, Briefcase, Download, Loader2, BarChart3, IndianRupee, FolderKanban, CheckCircle, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    const safeTasks = tasks || [];
    const safeProjects = projects || [];
    const safeClients = clients || [];

    const totalRevenue = useMemo(() => {
        return safeProjects.reduce((acc, proj) => {
            const client = safeClients.find(c => c.id === proj?.client?.id);
            return acc + getPackagePrice(client?.packageName);
        }, 0);
    }, [safeProjects, safeClients]);

    const kpis = [
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: '#10B981', change: '+12%' },
        { label: 'Total Clients', value: safeClients.length.toString(), icon: Users, color: '#7C3AED', change: '+8%' },
        { label: 'Total Projects', value: safeProjects.length.toString(), icon: FolderKanban, color: '#3B82F6', change: '+24%' },
        { label: 'Completed Tasks', value: safeTasks.filter(t => t?.status === 'Completed').length.toString(), icon: IndianRupee, color: '#EC4899', change: '+18%' },
    ];

    const executiveSummary = `This report provides a comprehensive overview of BookYourBrands' performance, analyzing key metrics across revenue, client acquisition, and operational efficiency.`;

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
                    <h3 className="font-semibold text-white mb-2">Task Status Overview</h3>
                    <p className="text-xs text-muted-foreground mb-4">Distribution of tasks by current status</p>
                    <div className="h-64">
                        <OverviewChart tasks={safeTasks} />
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

    // Safe arrays - prevent crashes from undefined data
    const safeTasks = tasks || [];
    const safeClients = clients || [];
    const safeProjects = projects || [];
    const safeTeamMembers = teamMembers || [];
    const safeTimerSessions = timerSessions || [];

    if (user?.role !== 'admin') {
        if (typeof window !== 'undefined') {
            redirect('/dashboard');
        }
        return null;
    }

    const generateBusinessReport = async () => {
        setIsDownloading(true);
        try {
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
                doc.text(`BookYourBrands | Business Analytics Report`, margin, 30);
                doc.text(`Page ${pageNum}`, pageWidth - margin, 30, { align: 'right' });
            };

            const addSectionTitle = (title: string, y: number) => {
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(10, 26, 47);
                doc.text(title, margin, y);
                y += 10;
                doc.setDrawColor(219, 165, 32);
                doc.setLineWidth(1.5);
                doc.line(margin, y, margin + 40, y);
                return y + 30;
            };

            // Cover Page
            doc.setFillColor(10, 26, 47);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.setTextColor(255, 255, 255);
            doc.text('BookYourBrands', pageWidth / 2, pageHeight / 2 - 40, { align: 'center' });
            doc.setFontSize(18);
            doc.text('Business Analytics Report', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
            doc.setFontSize(12);
            doc.setTextColor(200, 200, 200);
            doc.text(`Annual Performance & Strategic Insights | ${year}`, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });

            // Business Analytics
            doc.addPage();
            let currentPage = 2;
            addPageHeader("Business Analytics", currentPage);
            let y = 80;
            y = addSectionTitle("Business Analytics", y);

            const totalRevenue = safeProjects.reduce((acc, proj) => {
                const client = safeClients.find(c => c.id === proj?.client?.id);
                return acc + getPackagePrice(client?.packageName);
            }, 0);

            const kpiData = [
                ['Total Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`],
                ['Total Clients', safeClients.length.toString()],
                ['Total Projects', safeProjects.length.toString()],
                ['Completed Tasks', safeTasks.filter(t => t?.status === 'Completed').length.toString()]
            ];

            (doc as any).autoTable({
                startY: y,
                head: [['Key Performance Indicator', 'Value']],
                body: kpiData,
                theme: 'striped',
                headStyles: { fillColor: [10, 26, 47] },
            });
            y = (doc as any).lastAutoTable.finalY + 30;

            // Client Analytics
            doc.addPage();
            currentPage++;
            addPageHeader("Client Analytics", currentPage);
            y = 80;
            y = addSectionTitle("Client Analytics", y);

            const clientTableData = safeClients.map(client => {
                const clientProjects = safeProjects.filter(p => p?.client?.id === client.id);
                const revenue = clientProjects.reduce((acc, p) => acc + getPackagePrice(client?.packageName), 0);
                return [
                    client?.name || '-',
                    client?.company || '-',
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

            // Team Analytics
            doc.addPage();
            currentPage++;
            addPageHeader("Team Analytics", currentPage);
            y = 80;
            y = addSectionTitle("Team Analytics", y);

            const cutoffDate = subDays(new Date(), 30);
            const teamTableData = safeTeamMembers.map(member => {
                const completedTasks = safeTasks.filter(t =>
                    t?.assignedTo?.id === member.id && t?.status === 'Completed'
                ).length;
                const totalTime = safeTimerSessions
                    .filter(session => session?.userId === member.id && session?.date && isAfter(parseISO(session.date), cutoffDate))
                    .reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0), 0);

                const hours = Math.floor(totalTime / 3600000);
                const minutes = Math.floor((totalTime % 3600000) / 60000);
                return [member?.name || '-', member?.role || '-', completedTasks.toString(), `${hours}h ${minutes}m`];
            });

            (doc as any).autoTable({
                startY: y,
                head: [['Team Member', 'Role', 'Tasks Completed', 'Time Tracked (Last 30 Days)']],
                body: teamTableData,
                theme: 'grid',
                headStyles: { fillColor: [10, 26, 47] }
            });

            // Signature Page
            doc.addPage();
            currentPage++;
            addPageHeader("Signature", currentPage);
            y = pageHeight / 2;
            doc.setFont('times', 'italic');
            doc.setFontSize(22);
            doc.setTextColor(0, 0, 0);
            doc.text('Preeti Lalani', margin, y);
            doc.setDrawColor(150);
            doc.setLineWidth(1);
            doc.line(margin, y + 10, margin + 150, y + 10);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text('Founder & CEO, BookYourBrands', margin, y + 30);

            doc.save(`BookYourBrands_Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } catch (error) {
            console.error('Report generation error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const generateTeamClientReport = async () => {
        setIsDownloading(true);
        try {
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
                const teamData = safeTeamMembers.map(member => {
                    const completedTasks = safeTasks.filter(task =>
                        task?.assignedTo?.id === member.id &&
                        task?.status === 'Completed' &&
                        (task?.remarks || []).some(r => r.toStatus === 'Completed' && new Date(r.timestamp) > cutoffDate)
                    ).length;
                    const totalTime = safeTimerSessions
                        .filter(session => session?.userId === member.id && session?.date && new Date(session.date) > cutoffDate)
                        .reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0), 0);

                    return [
                        member?.name || '-',
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
                const clientData = safeClients.map(client => {
                    const clientProjects = safeProjects.filter(p => p?.client?.id === client.id);
                    const revenue = clientProjects.reduce((acc, p) => acc + getPackagePrice(client?.packageName), 0);
                    return [client?.name || '-', clientProjects.length.toString(), `₹${revenue.toLocaleString('en-IN')}`];
                });

                (doc as any).autoTable({
                    startY: 40,
                    head: [['Client', 'Projects Created', 'Total Revenue']],
                    body: clientData
                });
            }

            doc.save(`${reportTitle.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } catch (error) {
            console.error('Report generation error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

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
        const totalRevenue = safeProjects.reduce((acc, proj) => {
            const client = safeClients.find(c => c.id === proj?.client?.id);
            return acc + getPackagePrice(client?.packageName);
        }, 0);
        return [
            { label: 'Total Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}k`, icon: IndianRupee, color: '#10B981' },
            { label: 'Total Clients', value: safeClients.length, icon: Users, color: '#7C3AED' },
            { label: 'Active Projects', value: safeProjects.filter(p => p?.status === 'Active' || p?.status === 'In Progress').length, icon: FolderKanban, color: '#3B82F6' },
            { label: 'Completed Tasks', value: safeTasks.filter(t => t?.status === 'Completed').length, icon: CheckCircle, color: '#EC4899' },
        ];
    }, [safeProjects, safeClients, safeTasks]);

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
                {activeTab === 'business-analytics' && <BusinessAnalytics tasks={safeTasks} projects={safeProjects} clients={safeClients} />}
            </div>

            <div className="absolute -left-[9999px] top-0 w-[800px] bg-background p-4">
                <div id="overview-chart-for-pdf">
                    <OverviewChart tasks={safeTasks} />
                </div>
            </div>
        </div>
    );
}
