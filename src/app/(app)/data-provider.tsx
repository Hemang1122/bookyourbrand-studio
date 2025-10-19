
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, TaskRemark } from '@/lib/types';
import { projects as initialProjects, tasks as initialTasks, users as initialUsers, clients as initialClients } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';

type DataContextType = {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  teamMembers: User[];
  users: User[];
  scrumUpdates: ScrumUpdate[];
  addProject: (project: Omit<Project, 'id' | 'coverImage'>) => void;
  addTask: (task: Omit<Task, 'id' | 'assignedTo' | 'status'>) => void;
  updateProjectTeam: (projectId: string, teamMemberIds: string[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, remark: string) => void;
  addClient: (name: string, company: string, email: string) => void;
  addTeamMember: (name: string, email: string) => void;
  addScrumUpdate: (update: Omit<ScrumUpdate, 'id'>) => void;
  triggerNotification: () => void;
  playNotification: boolean;
  notificationPlayed: () => void;
  isLoading: boolean;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [scrumUpdates, setScrumUpdates] = useState<ScrumUpdate[]>([]);
  const [playNotification, setPlayNotification] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();


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
    const assignedTo = project?.team[0] || users.find(u => u.role === 'team') || users[0];

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

  const updateTaskStatus = (taskId: string, status: TaskStatus, remark: string) => {
    if (!currentUser) return;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newRemark: TaskRemark = {
          userId: currentUser.id,
          userName: currentUser.name,
          remark,
          timestamp: new Date().toISOString(),
          fromStatus: t.status,
          toStatus: status,
        };
        
        const updatedRemarks = t.remarks ? [...t.remarks, newRemark] : [newRemark];
        
        return { ...t, status: status, remarks: updatedRemarks };
      }
      return t;
    }));
    toast({ title: 'Task Updated', description: `Task status changed to "${status}".` });
  }

  const addClient = (name: string, company: string, email: string) => {
     const newClient: Client = {
        id: `client-${Date.now()}`,
        name,
        company,
        email,
        avatar: `avatar-${(users.length % 6) + 1}`,
     };
     const newUser: User = {
        id: newClient.id,
        name,
        email,
        avatar: newClient.avatar,
        role: 'client',
        username: name.toLowerCase().replace(/\s/g, ''),
     }
     setClients(prev => [...prev, newClient]);
     setUsers(prev => [...prev, newUser]);
  }

  const addTeamMember = (name: string, email: string) => {
    const newMember: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        avatar: `avatar-${(users.length % 6) + 1}`,
        role: 'team',
        username: name.toLowerCase().replace(/\s/g, ''),
     };
     setUsers(prev => [...prev, newMember]);
  }
  
  const triggerNotification = () => {
    setPlayNotification(true);
  };

  const notificationPlayed = () => {
    setPlayNotification(false);
  };

  const addScrumUpdate = (update: Omit<ScrumUpdate, 'id'>) => {
    const newUpdate: ScrumUpdate = { ...update, id: `scrum-${Date.now()}` };
    setScrumUpdates(prev => [...prev, newUpdate]);
  };


  return (
    <DataContext.Provider value={{ 
        projects, 
        tasks, 
        clients, 
        teamMembers, 
        users, 
        scrumUpdates,
        addProject, 
        addTask, 
        updateProjectTeam, 
        updateTaskStatus,
        addClient, 
        addTeamMember, 
        addScrumUpdate,
        triggerNotification, 
        playNotification, 
        notificationPlayed,
        isLoading: false
    }}>
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
