'use client';

import type { Project, User } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { useMemo } from 'react';

export function ProjectList() {
  const { projects, users, isLoading } = useData();
  const { user } = useAuth();

  const filteredProjects = useMemo(() => {
    if (!user || !projects) return [];
    if (user.role === 'client') {
      return projects.filter(p => p.client.id === user.id);
    }
    if (user.role === 'team') {
      return projects.filter(p => p.team_ids && p.team_ids.includes(user.id));
    }
    return projects; // Admins see all projects
  }, [projects, user]);

  const teamEditorMapping = useMemo(() => {
    if (!users) return new Map<string, string>();
    const mapping = new Map<string, string>();
    let editorCount = 1;
    users
      .filter(u => u.role === 'team' || u.role === 'admin')
      .forEach(u => {
        mapping.set(u.id, `Editor ${editorCount++}`);
      });
    return mapping;
  }, [users]);

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
        
        let teamMembers: (User | {id: string, name: string})[] = users.filter(u => project.team_ids && project.team_ids.includes(u.id));

        if (user?.role === 'client') {
            teamMembers = project.team_ids.map(id => ({ id, name: teamEditorMapping.get(id) || 'Editor' }));
        }

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
                <Badge variant={project.status === 'Completed' ? 'secondary' : 'default'} className="mb-2">
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
              No projects found.
          </div>
      )}
    </div>
  );
}
