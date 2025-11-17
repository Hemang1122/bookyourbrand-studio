
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamAnalytics } from './components/team-analytics';
import { ClientAnalytics } from './components/client-analytics';
import { useAuth } from '@/firebase/provider';
import { redirect } from 'next/navigation';
import { Users, Briefcase } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function ReportsPage() {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState<number>(7);

    if (user?.role !== 'admin') {
        if (typeof window !== 'undefined') {
            redirect('/dashboard');
        }
        return null;
    }

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
                </div>
            </div>

            <Tabs defaultValue="team-analytics" className="w-full">
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
