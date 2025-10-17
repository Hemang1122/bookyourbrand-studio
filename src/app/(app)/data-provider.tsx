'use client';

import { createContext, useContext, useState } from 'react';
import type { Project, Task } from '@/lib/types';
import { projects as initialProjects, tasks as initialTasks } from '@/lib/data';

type DataContextType = {
  projects: Project[];
  tasks: Task[];
  addProject: (project: Omit<Project, 'id' | 'coverImage'>) => void;
  addTask: (task: Omit<Task, 'id' | 'assignedTo' | 'status'>) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addProject = (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status'>) => {
    // Find the project to assign a team member from that project
    const project = projects.find(p => p.id === taskData.projectId);
    const assignedTo = project?.team[0] || initialProjects[0].team[0]; // Fallback

    const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        assignedTo: assignedTo,
        status: 'Pending',
    };
    setTasks(prev => [...prev, newTask]);
  }

  return (
    <DataContext.Provider value={{ projects, tasks, addProject, addTask }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
