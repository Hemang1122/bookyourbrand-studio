import type { Project } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type ProjectListProps = {
  projects: Project[];
};

export function ProjectList({ projects }: ProjectListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const coverImage = PlaceHolderImages.find(img => img.id === project.coverImage);
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
                    {project.team.map(member => {
                        const avatar = PlaceHolderImages.find(img => img.id === member.avatar);
                        return (
                            <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={avatar?.imageUrl} alt={member.name} data-ai-hint={avatar?.imageHint} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )
                    })}
                </div>
                <Button variant="link">View Project</Button>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
