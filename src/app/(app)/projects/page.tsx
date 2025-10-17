import { projects } from '@/lib/data';
import { ProjectList } from './components/project-list';

export default function ProjectsPage() {
  // In a real app, you would fetch projects based on user role
  const allProjects = projects;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        {/* A button to create new projects can be added here for admins */}
      </div>
      <ProjectList projects={allProjects} />
    </div>
  );
}
