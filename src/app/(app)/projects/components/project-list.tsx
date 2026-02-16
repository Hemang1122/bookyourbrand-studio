'use client';

import type { Project, User, ProjectStatus } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, FolderKanban } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';


const getStatusBadgeClasses = (status: ProjectStatus) => {
    switch (status) {
        case 'Active':
            return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
        case 'In Progress':
            return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
        case 'Approved':
        case 'Completed':
            return 'bg-green-500/20 text-green-400 border border-green-500/30';
        case 'Rework':
            return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
        case 'On Hold':
             return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        default:
            return 'bg-secondary text-secondary-foreground';
    }
}


export function ProjectList({ statusFilter, searchQuery }: { statusFilter: ProjectStatus | 'All'; searchQuery: string; }) {
  const { projects, users, isLoading } = useData();
  const { user } = useAuth();

  const filteredProjects = useMemo(() => {
    if (!user || !projects) return [];
    
    let userProjects = projects;
    if (user.role === 'client') {
      userProjects = projects.filter(p => p.client.id === user.id);
    } else if (user.role === 'team') {
      userProjects = projects.filter(p => p.team_ids && p.team_ids.includes(user.id));
    }

    let statusFilteredProjects = userProjects;
    if (statusFilter !== 'All') {
      statusFilteredProjects = userProjects.filter(p => p.status === statusFilter);
    }

    if (!searchQuery) {
        return statusFilteredProjects;
    }

    return statusFilteredProjects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.client.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  }, [projects, user, statusFilter, searchQuery]);

  if (isLoading) {
    return (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-[#13131F] border border-white/5">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-5 w-3/4" />
                   <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                    <div className='flex items-center gap-2'>
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
         </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredProjects.map((project) => {
        const coverImage = PlaceHolderImages.find(img => img.id === project.coverImage);
        const teamMembers: Partial<User>[] = users.filter(u => project.team_ids && project.team_ids.includes(u.id));
        const primaryEditor = teamMembers[0];

        return (
          <Link href={`/projects/${project.id}`} key={project.id} className="block">
            <Card className="group rounded-2xl overflow-hidden bg-[#13131F] border border-white/5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
                <div className="relative h-48 w-full">
                  {coverImage && (
                    <Image
                      src={coverImage.imageUrl}
                      alt={project.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      data-ai-hint={coverImage.imageHint}
                    />
                  )}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              <CardContent className="p-4">
                <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors mb-2", getStatusBadgeClasses(project.status))}>
                  {project.status}
                </div>
                <h3 className="text-base font-semibold text-white truncate">{project.name}</h3>
                <p className="text-sm text-muted-foreground">{project.client.name}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        {primaryEditor ? (
                            <>
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200">
                                        {primaryEditor.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                    {primaryEditor.name}
                                </span>
                            </>
                        ) : (
                             <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                    </div>
                    
                    <span className="text-xs font-medium text-purple-400 group-hover:text-pink-400 transition-colors flex items-center gap-1">
                        View Project 
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
       {filteredProjects.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-purple-500/10 border border-purple-500/20">
                <FolderKanban className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
                No projects found
            </h3>
            <p className="text-gray-500 text-sm">
                Try a different filter or search term.
            </p>
          </div>
      )}
    </div>
  );
}
