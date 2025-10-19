
'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, Notification, ProjectStatus } from '@/lib/types';
import { users as initialUsers, clients as initialClients, projects as initialProjects, tasks as initialTasks } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

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
  addClient: (clientData: {
    name: string;
    company: string;
    email: string;
    founderDetails: string;
    agreementUrl?: string;
    idCardUrl?: string;
  }) => void;
  updateClient: (clientId: string, clientData: Partial<Client>) => void;
  addTeamMember: (memberData: {
    name: string;
    email: string;
    aadharUrl?: string;
    panUrl?: string;
    joiningLetterUrl?: string;
  }) => void;
  updateTeamMember: (userId: string, memberData: Partial<User>) => void;
  addScrumUpdate: (update: Omit<ScrumUpdate, 'id'>) => void;
  addNotification: (message: string, projectId: string) => void;
  markNotificationsAsRead: (projectId?: string) => void;
  triggerNotification: () => void;
  playNotification: boolean;
  notificationPlayed: () => void;
  isLoading: boolean;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team' | 'coverImage'>>) => void;
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
  const router = useRouter();


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

  const addClient = (clientData: {name: string, company: string, email: string, founderDetails: string, agreementUrl?: string, idCardUrl?: string}) => {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: clientData.name,
      company: clientData.company,
      email: clientData.email,
      founderDetails: clientData.founderDetails,
      agreementUrl: clientData.agreementUrl,
      idCardUrl: clientData.idCardUrl,
      avatar: `avatar-${(clients.length % 6) + 1}`,
    };
    const newUser: User = {
        id: newClient.id,
        name: clientData.name,
        email: clientData.email,
        avatar: newClient.avatar,
        role: 'client',
        username: clientData.name.toLowerCase().replace(/\s/g, ''),
    }
    setClients(prev => [...prev, newClient]);
    setUsers(prev => [...prev, newUser]);
  }
  
  const updateClient = (clientId: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...clientData } : c));
  }

  const addTeamMember = (memberData: { name: string, email: string, aadharUrl?: string, panUrl?: string, joiningLetterUrl?: string }) => {
     const newMember: User = {
        id: `user-${Date.now()}`,
        name: memberData.name,
        email: memberData.email,
        aadharUrl: memberData.aadharUrl,
        panUrl: memberData.panUrl,
        joiningLetterUrl: memberData.joiningLetterUrl,
        avatar: `avatar-${(users.length % 6) + 1}`,
        role: 'team',
        username: memberData.name.toLowerCase().replace(/\s/g, ''),
     };
     setUsers(prev => [...prev, newMember]);
  }

  const updateTeamMember = (userId: string, memberData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...memberData } : u));
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

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
    toast({ title: 'Project Deleted', description: 'The project and all its tasks have been removed.' });
    router.push('/projects');
  };

  const updateProject = (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team' | 'coverImage'>>) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            const updatedProject = { ...p, ...projectData };
            addNotification(`Project "${updatedProject.name}" has been updated.`, projectId);
            return updatedProject;
        }
        return p;
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
        updateClient,
        addTeamMember,
        updateTeamMember,
        addScrumUpdate,
        addNotification,
        markNotificationsAsRead,
        triggerNotification, 
        playNotification, 
        notificationPlayed,
        isLoading: false,
        deleteProject,
        updateProject
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
