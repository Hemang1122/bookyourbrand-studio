'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderKanban, Clock, CheckCircle2, Plus, Film, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AddProjectDialog } from '../../projects/components/add-project-dialog';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';

export function ClientDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { projects, tasks, addProject, isLoading, clients } = useData();

  const myClientRecord = useMemo(() => {
    if (!user || !clients) return null;
    return clients.find(c => c.id === user.id);
  }, [user, clients]);


  if (isLoading || !myClientRecord) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Client Dashboard</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1,2,3,4].map(i => <Card key={i} className="h-32 animate-pulse bg-muted/50" />)}
            </div>
        </div>
      )
  }

  const myProjects = projects ? projects.filter(p => p.client.id === myClientRecord?.id) : [];
  const activeProjects = myProjects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
  const completedProjects = myProjects.filter(p => p.status === 'Completed' || p.status === 'Approved').length;
  const safeTasks = tasks || [];
  
  const reelsLimit = myClientRecord.reelsLimit || 0;
  const reelsUsed = myClientRecord.currentPackage?.reelsUsed || 0;
  const canAddProject = reelsUsed < reelsLimit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Client Dashboard</h2>
          <p className="text-muted-foreground">Manage your video projects and track editing progress.</p>
        </div>
        <div className="flex items-center gap-2">
            {canAddProject ? (
              <AddProjectDialog onProjectAdd={addProject} client={myClientRecord}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 border-0 shadow-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
              </AddProjectDialog>
            ) : (
              <Button onClick={() => router.push('/packages')} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {/* Package Status Card */}
         <Card 
          className="md:col-span-2 bg-gradient-to-br from-purple-900/20 to-pink-900/10 border-purple-500/20 relative overflow-hidden group cursor-pointer hover:border-purple-500/40 transition-all"
          onClick={() => router.push('/packages')}
         >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl bg-primary group-hover:opacity-20 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
                <CardTitle className="text-sm font-medium text-purple-300">Active Subscription</CardTitle>
                <CardDescription className="text-white text-lg font-bold">
                    {myClientRecord.currentPackage?.packageName || 'No Active Plan'}
                </CardDescription>
            </div>
            <Badge variant={myClientRecord.currentPackage?.status === 'active' ? 'default' : 'secondary'} className="bg-primary/20 text-primary border-primary/30">
                {myClientRecord.currentPackage?.status || 'Inactive'}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            {myClientRecord.currentPackage ? (
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Usage Allowance</span>
                            <span className="font-bold text-white">
                                {reelsUsed} / {reelsLimit} Reels
                            </span>
                        </div>
                        <Progress value={(reelsUsed / reelsLimit) * 100} className="h-2 bg-white/5" />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">
                            {myClientRecord.currentPackage.duration}s duration per reel
                        </span>
                        <div className="flex items-center text-primary font-medium">
                            View Details <ChevronRight className="ml-1 h-3 w-3" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <Button size="sm" className="bg-primary/20 text-white border border-primary/30 hover:bg-primary/30">
                        Choose a Package
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>

        <Link href="/projects" className="block h-full">
          <Card className="bg-[#13131F] border-white/5 h-full hover:border-purple-500/30 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{activeProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently in editing</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/projects" className="block h-full">
          <Card className="bg-[#13131F] border-white/5 h-full hover:border-green-500/30 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Delivered</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{completedProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">Projects approved</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#13131F] border-white/5">
            <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                <CardTitle className="text-white">Recent Projects</CardTitle>
                <CardDescription>Track the progress of your ongoing video edits.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary" asChild>
                    <Link href="/projects">View All</Link>
                </Button>
            </div>
            </CardHeader>
            <CardContent>
            {myProjects.length > 0 ? (
                <div className="space-y-6">
                {myProjects.slice(0, 5).map(project => {
                    const projectTasks = safeTasks.filter(t => t.projectId === project.id);
                    const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
                    const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
                    return (
                    <Link key={project.id} href={`/projects/${project.id}`} className="block group">
                        <div className="space-y-2 p-4 rounded-xl border border-white/5 group-hover:border-purple-500/20 transition-all bg-black/20">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <h3 className="font-semibold text-white group-hover:text-primary transition-colors">{project.name}</h3>
                                    <p className="text-xs text-muted-foreground">
                                      Deadline: {project.deadline ? format(new Date(project.deadline), 'PP') : 'Not set'}
                                    </p>
                                </div>
                                <Badge variant={project.status === 'Completed' ? 'secondary' : 'default'} className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                                    {project.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 pt-2">
                                <Progress value={progress} className="h-1.5 bg-white/5" />
                                <span className="text-xs font-mono text-muted-foreground">{Math.round(progress)}%</span>
                            </div>
                            <div className="flex justify-end mt-2">
                                <span className="flex items-center text-xs text-gray-400 group-hover:text-white transition-colors">
                                    Details <ChevronRight className="ml-1 h-3 w-3" />
                                </span>
                            </div>
                        </div>
                    </Link>
                    );
                })}
                <Button variant="outline" className="w-full mt-4 border-white/10 hover:bg-white/5 text-white" asChild>
                    <Link href="/projects">View All Projects →</Link>
                </Button>
                </div>
            ) : (
                <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
                    <Film className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-muted-foreground mb-6">You haven't started any projects yet.</p>
                {canAddProject && (
                    <AddProjectDialog onProjectAdd={addProject} client={myClientRecord}>
                        <Button className="bg-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        Start Your First Project
                        </Button>
                    </AddProjectDialog>
                )}
                </div>
            )}
            </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="bg-[#13131F] border-white/5">
                <CardHeader>
                    <CardTitle className="text-sm text-white">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                        Our support team typically responds to project queries within 24 hours during business hours.
                    </p>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white" asChild>
                        <Link href="/support">Open Support Chat</Link>
                    </Button>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-primary/20 to-pink-500/10 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-sm text-white font-bold">Pro Tip</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        Uploading high-quality raw footage and detailed guidelines helps our editors deliver your first draft faster!
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
