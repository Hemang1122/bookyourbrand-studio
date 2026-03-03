
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
import { Badge } from '@/components/ui/badge';

const getStatusBadgeClasses = (status: ProjectStatus) => {
    switch (status) {
        case 'Active':
            return 'bg-blue-500/90 hover:bg-blue-500 text-white border-0';
        case 'In Progress':
            return 'bg-purple-500/90 hover:bg-purple-500 text-white border-0';
        case 'Approved':
        case 'Completed':
            return 'bg-green-500/90 hover:bg-green-500 text-white border-0';
        case 'Rework':
            return 'bg-orange-500/90 hover:bg-orange-500 text-white border-0';
        case 'On Hold':
             return 'bg-gray-500/90 hover:bg-gray-500 text-white border-0';
        default:
            return 'bg-secondary text-secondary-foreground';
    }
}

export function ProjectList({ projects, isLoading }: { projects: Project[]; isLoading?: boolean; }) {
  const { users } = useData();

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
      {projects.map((project) => {
        const coverImage = PlaceHolderImages.find(img => img.id === project.coverImage);
        const teamMembers: Partial<User>[] = users.filter(u => project.team_ids && project.team_ids.includes(u.id));
        const primaryEditor = teamMembers[0];

        return (
          <Link href={`/projects/${project.id}`} key={project.id} className="block">
            <Card className="group h-full rounded-2xl overflow-hidden bg-[#13131F] border border-white/5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
                <div className="relative h-48 w-full">
                  {coverImage ? (
                    <Image
                      src={coverImage.imageUrl}
                      alt={project.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      data-ai-hint={coverImage.imageHint}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <FolderKanban className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                   <Badge 
                    className={cn(
                      "absolute top-3 right-3 font-semibold",
                      getStatusBadgeClasses(project.status)
                    )}
                  >
                    {project.status}
                  </Badge>
                </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white truncate group-hover:text-purple-300 transition-colors mb-2">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">For: {project.client.name}</p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        {primaryEditor ? (
                            <>
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200">
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
                        View Details 
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
       {projects.length === 0 && (
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
