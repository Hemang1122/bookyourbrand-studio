import type { Task, Project } from '@/lib/types';
import { compareDesc, parseISO } from 'date-fns';

type RecentActivityProps = {
    tasks: Task[];
    projects: Project[];
}

export function RecentActivity({ tasks, projects }: RecentActivityProps) {
  const recentCompletedTasks = tasks
    .filter((task) => task.status === 'Completed')
    .sort((a, b) => compareDesc(parseISO(a.dueDate), parseISO(b.dueDate)))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {recentCompletedTasks.length > 0 ? (
        recentCompletedTasks.map((task) => {
            const project = projects.find(p => p.id === task.projectId);
            return (
                <div key={task.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                        <span className="font-semibold">{task.assignedTo.name}</span> completed a task.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        "{task.title}" in project "{project?.name}"
                    </p>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</div>
                </div>
            )
        })
      ) : (
        <div className="text-center text-muted-foreground p-4">
            No recent completed tasks.
        </div>
      )}
    </div>
  );
}
