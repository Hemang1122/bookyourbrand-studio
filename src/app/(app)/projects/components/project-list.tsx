
'use client';

import type { Project, User, ProjectStatus } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

type ProjectListProps = {
  statusFilter: ProjectStatus | 'All';
  searchQuery: string;
};

const getStatusBadgeVariant = (status: ProjectStatus) => {
    switch (status) {
        case 'Active':
        case 'In Progress':
            return 'default';
        case 'Completed':
            return 'secondary';
        case 'On Hold':
        case 'Rework':
            return 'destructive';
        default:
            return 'outline';
    }
}

const getStatusBadgeClass = (status: ProjectStatus) => {
    switch (status) {
        case 'Active':
        case 'In Progress':
            return 'bg-green-600/90 hover:bg-green-600 text-white';
        case 'Completed':
            return '';
        case 'On Hold':
            return 'bg-amber-500/90 hover:bg-amber-500 text-white';
        case 'Rework':
            return 'bg-red-500/90 hover:bg-red-500 text-white';
        default:
            return '';
    }
}


export function ProjectList({ statusFilter, searchQuery }: ProjectListProps) {
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

    return statusFilteredProjects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  }, [projects, user, statusFilter, searchQuery]);

  if (isLoading) {
    return (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card><CardHeader><div className="h-48 w-full bg-muted animate-pulse"></div></CardHeader><CardContent><div className="h-6 w-3/4 bg-muted animate-pulse rounded"></div><div className="h-4 w-1/2 mt-2 bg-muted animate-pulse rounded"></div></CardContent></Card>
            <Card><CardHeader><div className="h-48 w-full bg-muted animate-pulse"></div></CardHeader><CardContent><div className="h-6 w-3/4 bg-muted animate-pulse rounded"></div><div className="h-4 w-1/2 mt-2 bg-muted animate-pulse rounded"></div></CardContent></Card>
            <Card><CardHeader><div className="h-48 w-full bg-muted animate-pulse"></div></CardHeader><CardContent><div className="h-6 w-3/4 bg-muted animate-pulse rounded"></div><div className="h-4 w-1/2 mt-2 bg-muted animate-pulse rounded"></div></CardContent></Card>
         </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredProjects.map((project) => {
        const coverImage = PlaceHolderImages.find(img => img.id === project.coverImage);
        
        const teamMembers: Partial<User>[] = users.filter(u => project.team_ids && project.team_ids.includes(u.id));

        return (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader className="p-0">
                <div className="relative h-48 w-full">
                  {coverImage && (
                    <Image
                      src={coverImage.imageUrl}
                      alt={project.name}
                      fill
                      className="object-cover"
                      data-ai-hint={coverImage.imageHint}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Badge variant={getStatusBadgeVariant(project.status)} className={cn("mb-2", getStatusBadgeClass(project.status))}>
                  {project.status}
                </Badge>
                <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                <CardDescription>{project.client.name}</CardDescription>
              </CardContent>
              <CardFooter className="flex justify-between p-4 pt-0">
                 <div className="flex -space-x-2 overflow-hidden">
                    {teamMembers.map(member => (
                        <div key={member.id} className="text-xs text-muted-foreground pr-2">
                          {member.name}
                        </div>
                    ))}
                 </div>
                <Button variant="link">View Project</Button>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
       {filteredProjects.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-12">
              No projects found for the selected filter.
          </div>
      )}
    </div>
  );
}
