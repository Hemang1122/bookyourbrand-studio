
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
import { format, subDays, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, getYear } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { User, TimerSession, PackageName, Project, Task } from '@/lib/types';
import { packages } from '../settings/billing/packages-data';
import html2canvas from 'html2canvas';
import { OverviewChart } from '../dashboard/components/overview-chart';
import { Card, CardContent } from '@/components/ui/card';


type AnalyticsTab = 'team-analytics' | 'client-analytics' | 'business-analytics';

// Helper to get a value from localStorage, keyed by user ID
const getLocalStorage = (key: string, userId: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue;
    const userKey = `${key}_${userId}`;
    const storedValue = window.localStorage.getItem(userKey);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
};

const BusinessAnalytics = ({ tasks, projects, clients }: { tasks: Task[], projects: Project[], clients: any[] }) => {
    const totalRevenue = useMemo(() => {
        const getPackagePrice = (packageName: PackageName | undefined): number => {
            if (!packageName) return 0;
            const pkg = packages.find(p => p.name === packageName);
            const tier = pkg?.tiers?.[0];
            if (!tier || !tier.price) return 0;
            return parseInt(tier.price.replace(/,/g, ''), 10);
        };
        return projects.reduce((acc, proj) => {
            return acc + getPackagePrice(proj.client.packageName);
        }, 0);
    }, [projects]);

    const kpis = {
        totalRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
        totalClients: clients.length,
        totalProjects: projects.length,
        completedTasks: tasks.filter(t => t.status === 'Completed').length,
    };

    return (
        <Card>
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
                                <div key={key} className="p-4 bg-background rounded-lg">
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

    const generateBusinessReport = async () => {
        setIsDownloading(true);

        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 60;
        
        // --- Cover Page ---
        doc.setFillColor(41, 22, 60); // Deep Blue
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        doc.setTextColor(255, 255, 255);
        doc.text('BookYourBrands', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
        doc.setFontSize(18);
        doc.setTextColor(200, 200, 200);
        doc.text('Business Analytics Report', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
        
        doc.addPage();
        
        let y = margin;
        
        // --- Header for subsequent pages ---
        const pageHeader = (title: string) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('BookYourBrands | Business Analytics Report', margin, 40);
            doc.text(title, pageWidth - margin, 40, { align: 'right' });
            y = 80;
            doc.setDrawColor(220);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 30;
        };

        const addSection = (title: string, body: (yPos: number) => number) => {
            pageHeader(title);
            y = body(y);
        };

        // --- Executive Summary ---
        addSection("Executive Summary", (yPos) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(80);
            const summaryText = "This report provides a comprehensive overview of BookYourBrands' performance, analyzing key metrics across revenue, client acquisition, and operational efficiency. The data highlights a strong growth trajectory and identifies key areas for strategic focus to maintain momentum and drive future success.";
            const lines = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
            doc.text(lines, margin, yPos);
            return yPos + lines.length * 14 + 40;
        });

        // --- Data Analytics Section ---
        doc.addPage();
        addSection("Data Analytics", (yPos) => {
             const getPackagePrice = (packageName: PackageName | undefined): number => {
                if (!packageName) return 0;
                const pkg = packages.find(p => p.name === packageName);
                const tier = pkg?.tiers?.[0];
                if (!tier || !tier.price) return 0;
                return parseInt(tier.price.replace(/,/g, ''), 10);
            };

            const revenueData = projects.map(p => ({
                name: p.client.name,
                company: p.client.company,
                revenue: getPackagePrice(p.client.packageName),
            }));

            (doc as any).autoTable({
                startY: yPos,
                head: [['Client Name', 'Company', 'Revenue']],
                body: revenueData.map(d => [d.name, d.company, `₹${d.revenue.toLocaleString('en-IN')}`]),
                theme: 'striped',
                headStyles: { fillColor: [41, 22, 60] },
                margin: { left: margin, right: margin }
            });
            return (doc as any).lastAutoTable.finalY + 40;
        });

        // --- KPIs and Chart Section ---
        doc.addPage();
        addSection("KPIs & Task Overview", (yPos) => {
            const overviewChartElement = document.getElementById('overview-chart-for-pdf');
            if (overviewChartElement) {
                return html2canvas(overviewChartElement, { scale: 2 }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = pageWidth - margin * 2;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
                    return yPos + imgHeight + 40;
                });
            }
            return yPos;
        });
        
        // --- Recommendations ---
        doc.addPage();
        addSection("Recommendations", (yPos) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(80);
            const recommendations = [
                'Focus marketing efforts on high-value client segments to maximize ROI.',
                'Streamline the project onboarding process to improve client satisfaction.',
                'Introduce tiered premium support plans for an additional revenue stream.',
                'Invest in team training for advanced editing to upsell existing clients.'
            ];
            recommendations.forEach(rec => {
                 doc.text(`• ${rec}`, margin + 10, yPos);
                 yPos += 20;
            });
            return yPos;
        });

        // --- Final Page ---
        doc.addPage();
        const finalPageY = pageHeight - 200;
        doc.setFont('times', 'italic');
        doc.setFontSize(22);
        doc.setTextColor(0);
        doc.text('Arpit Lalani', margin, finalPageY);
        doc.setDrawColor(200);
        doc.setLineWidth(1);
        doc.line(margin, finalPageY + 10, margin + 150, finalPageY + 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Founder & CEO, BookYourBrands', margin, finalPageY + 30);
        
        doc.save(`BookYourBrands_Business_Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        setIsDownloading(false);
    };

    const handleDownload = async () => {
        if (activeTab === 'business-analytics') {
            await generateBusinessReport();
        }
        // ... (keep old logic for other tabs)
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
                     <Button onClick={handleDownload} disabled={isDownloading}>
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
            <div className="absolute -left-[9999px] top-0 w-[800px]">
                <div id="overview-chart-for-pdf">
                    <OverviewChart tasks={tasks} />
                </div>
            </div>
        </div>
    );
}
