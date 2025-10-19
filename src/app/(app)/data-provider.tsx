
'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, TaskRemark, Notification } from '@/lib/types';
import { users as initialUsers, clients as initialClients, projects as initialProjects, tasks as initialTasks } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';

type DataContextType = {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  teamMembers: User[];
  users: User[];
  scrumUpdates: ScrumUpdate[];
  notifications: Notification[];
  addProject: (project: Omit<Project, 'id' | 'coverImage'>) => void;
  addTask: (task: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks'>) => void;
  updateProjectTeam: (projectId: string, teamMemberIds: string[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, remark: string) => void;
  addClient: (name: string, company: string, email: string) => void;
  addTeamMember: (name: string, email: string) => void;
  addScrumUpdate: (update: Omit<ScrumUpdate, 'id'>) => void;
  addNotification: (message: string, projectId: string) => void;
  markNotificationsAsRead: (projectId?: string) => void;
  triggerNotification: () => void;
  playNotification: boolean;
  notificationPlayed: () => void;
  isLoading: boolean;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [scrumUpdates, setScrumUpdates] = useState<ScrumUpdate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [playNotification, setPlayNotification] = useState(false);

  const teamMembers = useMemo(() => users.filter(u => u.role === 'admin' || u.role === 'team'), [users]);


  const addProject = (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      ...projectData,
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
    };
    setProjects(prev => [...prev, newProject]);
    addNotification(`New project "${projectData.name}" was created.`, 'general');
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks'>) => {
    const project = projects.find(p => p.id === taskData.projectId);
    const assignedTo = project?.team[0] || users.find(u => u.role === 'team') || users[0];
    if (!assignedTo) {
        toast({title: "Error", description: "No one to assign task to."});
        return;
    }
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...taskData,
      assignedTo: assignedTo,
      status: 'Pending',
      remarks: [],
    };
    setTasks(prev => [...prev, newTask]);
    addNotification(`New task "${newTask.title}" added to project "${project?.name}".`, newTask.projectId);
  }

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newTeam = users.filter(u => teamMemberIds.includes(u.id));
        return { ...p, team: newTeam };
      }
      return p;
    }));
    const project = projects.find(p => p.id === projectId);
    if(project) {
        addNotification(`The team for project "${project.name}" has been updated.`, projectId);
    }
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
        const updatedTask = { ...t, status, remarks: [...t.remarks, newRemark] };
        const project = projects.find(p => p.id === updatedTask.projectId);
        if(project) {
            addNotification(`Task "${updatedTask.title}" in project "${project.name}" was updated to "${status}".`, updatedTask.projectId);
        }
        return updatedTask;
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
      avatar: `avatar-${(clients.length % 6) + 1}`,
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
    const newUpdate: ScrumUpdate = { ...update, id: `scrum-${Date.now()}`, timestamp: new Date().toISOString() };
    setScrumUpdates(prev => [...prev, newUpdate]);
  };

  const addNotification = (message: string, projectId: string) => {
    if (!currentUser) return;
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      message: `${currentUser.name} ${message}`,
      timestamp: new Date().toISOString(),
      projectId: projectId,
      read: false,
    };
    setNotifications(prev => [notification, ...prev]);
    triggerNotification();
  };

  const markNotificationsAsRead = (projectId?: string) => {
    setNotifications(prev => prev.map(n => {
        if (!n.read && (!projectId || n.projectId === projectId)) {
            return {...n, read: true};
        }
        return n;
    }));
  };

  return (
    <DataContext.Provider value={{ 
        projects, 
        tasks, 
        clients, 
        teamMembers, 
        users, 
        scrumUpdates,
        notifications,
        addProject, 
        addTask, 
        updateProjectTeam, 
        updateTaskStatus,
        addClient, 
        addTeamMember, 
        addScrumUpdate,
        addNotification,
        markNotificationsAsRead,
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
