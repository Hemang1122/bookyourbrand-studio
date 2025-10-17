'use client';

import { createContext, useContext, useState } from 'react';
import type { Project, Task } from '@/lib/types';
import { projects as initialProjects, tasks as initialTasks, users } from '@/lib/data';

type DataContextType = {
  projects: Project[];
  tasks: Task[];
  addProject: (project: Omit<Project, 'id' | 'team' | 'coverImage'>) => void;
  addTask: (task: Omit<Task, 'id' | 'assignedTo' | 'status'>) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addProject = (projectData: Omit<Project, 'id' | 'team' | 'coverImage'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      team: [users.find(u => u.role === 'team')!], // Mock team assignment
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status'>) => {
    const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        assignedTo: users.find(u => u.role === 'team')!, // Mock assignment
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
