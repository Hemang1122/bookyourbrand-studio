
'use client';

import { createContext, useContext, useState } from 'react';
import type { Project, Task, User, Client } from '@/lib/types';
import { projects as initialProjects, tasks as initialTasks, users as initialUsers, clients as initialClients } from '@/lib/data';

type DataContextType = {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  teamMembers: User[];
  users: User[];
  addProject: (project: Omit<Project, 'id' | 'coverImage'>) => void;
  addTask: (task: Omit<Task, 'id' | 'assignedTo' | 'status'>) => void;
  updateProjectTeam: (projectId: string, teamMemberIds: string[]) => void;
  addClient: (name: string, company: string, email: string, username: string, password?: string) => void;
  addTeamMember: (name: string, email: string, username: string, password?: string) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [users, setUsers] = useState<User[]>(initialUsers);

  const teamMembers = users.filter(u => u.role === 'admin' || u.role === 'team');

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

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newTeam = users.filter(u => teamMemberIds.includes(u.id));
        return { ...p, team: newTeam };
      }
      return p;
    }));
  };

  const addClient = (name: string, company: string, email: string, username: string, password?: string) => {
    const totalUsers = users.length;
    const newUser: User = {
      id: `user-${totalUsers + 1}`,
      name: name,
      email: email,
      avatar: `avatar-${(totalUsers % 6) + 1}`,
      role: 'client',
      username,
      password: password || 'password'
    };
    const newClient: Client = {
      id: `client-${clients.length + 1}`,
      name: name,
      email: email,
      company: company,
      avatar: newUser.avatar,
    };
    
    // Add to the source of truth for auth
    initialUsers.push(newUser);
    initialClients.push(newClient);

    setUsers(prev => [...prev, newUser]);
    setClients(prev => [...prev, newClient]);
  }

  const addTeamMember = (name: string, email: string, username: string, password?: string) => {
    const totalUsers = users.length;
    const newMember: User = {
      id: `user-${totalUsers + 1}`,
      name: name,
      email: email,
      avatar: `avatar-${(totalUsers % 6) + 1}`,
      role: 'team',
      username,
      password: password || 'password'
    };
    
    // Add to the source of truth for auth
    initialUsers.push(newMember);
    
    setUsers(prev => [...prev, newMember]);
  }

  return (
    <DataContext.Provider value={{ projects, tasks, clients, teamMembers, users, addProject, addTask, updateProjectTeam, addClient, addTeamMember }}>
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
