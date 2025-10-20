'use client';

import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, Notification, ProjectStatus, TaskRemark } from '@/lib/types';
import { users as initialUsers, clients as initialClients, projects as initialProjects, tasks as initialTasks } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';

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
  const [scrumUpdates, setScrumUpdates] = useState<ScrumUpdate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [playNotification, setPlayNotification] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  
  // Real-time data from Firestore
  const { data: firestoreProjects, isLoading: projectsLoading } = useCollection<Project>(useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    if (currentUser.role === 'admin') {
      return collection(firestore, 'projects');
    }
    if (currentUser.role === 'client') {
      return query(collection(firestore, 'projects'), where('client.id', '==', currentUser.id));
    }
    // Team member
    return query(collection(firestore, 'projects'), where('team', 'array-contains', currentUser.id));
  }, [firestore, currentUser]));
  
  const { data: firestoreUsers, isLoading: usersLoading } = useCollection<User>(useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]));

  const { data: firestoreClients, isLoading: clientsLoading } = useCollection<Client>(useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'clients');
  }, [firestore]));
  
  const { data: firestoreTasks, isLoading: tasksLoading } = useCollection<Task>(useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tasks');
  }, [firestore]));

  // Combine initial data with firestore data, giving precedence to firestore
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [clients, setClients] = useState<Client[]>(initialClients);

  useEffect(() => {
    if (firestoreProjects) setProjects(firestoreProjects);
  }, [firestoreProjects]);

  useEffect(() => {
    if (firestoreTasks) setTasks(firestoreTasks);
  }, [firestoreTasks]);

  useEffect(() => {
    if (firestoreUsers) setUsers(firestoreUsers);
  }, [firestoreUsers]);

  useEffect(() => {
    if (firestoreClients) setClients(firestoreClients);
  }, [firestoreClients]);

  const isLoading = projectsLoading || tasksLoading || usersLoading || clientsLoading;
  
  const teamMembers = useMemo(() => users.filter(u => u.role === 'admin' || u.role === 'team'), [users]);


  const addProject = (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      ...projectData,
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
    };
    if(firestore) {
        addDocumentNonBlocking(collection(firestore, 'projects'), newProject);
    }
    // Optimistically update local state
    setProjects(prev => [...prev, newProject]);
    addNotification(`New project "${projectData.name}" was created.`, 'general');
    router.push(`/projects/${newProject.id}`);
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
    if (firestore) {
        addDocumentNonBlocking(collection(firestore, 'tasks'), newTask);
    }
    setTasks(prev => [...prev, newTask]);
    addNotification(`New task "${newTask.title}" added to project "${project?.name}".`, newTask.projectId);
  }

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const newTeam = users.filter(u => teamMemberIds.includes(u.id));

    if (firestore) {
      const projectRef = doc(firestore, 'projects', projectId);
      updateDocumentNonBlocking(projectRef, { team: newTeam });
    }
    setProjects(prev => prev.map(p => p.id === projectId ? {...p, team: newTeam} : p));
    addNotification(`The team for project "${project.name}" has been updated.`, projectId);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus, remark: string) => {
    if (!currentUser) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newRemark: TaskRemark = {
      userId: currentUser.id,
      userName: currentUser.name,
      remark,
      timestamp: new Date().toISOString(),
      fromStatus: task.status,
      toStatus: status,
    };
    
    if (firestore) {
      const taskRef = doc(firestore, 'tasks', taskId);
      updateDocumentNonBlocking(taskRef, {
        status: status,
        remarks: [...task.remarks, newRemark]
      });
    }
    setTasks(prev => prev.map(t => t.id === taskId ? {...t, status, remarks: [...t.remarks, newRemark]} : t));

    const project = projects.find(p => p.id === task.projectId);
    if(project) {
        addNotification(`Task "${task.title}" in project "${project.name}" was updated to "${status}".`, task.projectId);
    }
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
      avatar: ''
    };
    const newUser: User = {
        id: newClient.id,
        name: clientData.name,
        email: clientData.email,
        role: 'client',
        username: clientData.name.toLowerCase().replace(/\s/g, ''),
        avatar: ''
    }
    if (firestore) {
        addDocumentNonBlocking(collection(firestore, 'clients'), newClient);
        addDocumentNonBlocking(collection(firestore, 'users'), newUser);
    }
    setClients(prev => [...prev, newClient]);
    setUsers(prev => [...prev, newUser]);
  }
  
  const updateClient = (clientId: string, clientData: Partial<Client>) => {
    if (!firestore) return;
    const clientRef = doc(firestore, 'clients', clientId);
    updateDocumentNonBlocking(clientRef, clientData);
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
        role: 'team',
        username: memberData.name.toLowerCase().replace(/\s/g, ''),
        avatar: ''
     };
     if (firestore) {
        addDocumentNonBlocking(collection(firestore, 'users'), newMember);
     }
     setUsers(prev => [...prev, newMember]);
  }

  const updateTeamMember = (userId: string, memberData: Partial<User>) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, memberData);
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
    if (firestore) {
        addDocumentNonBlocking(collection(firestore, 'scrum-updates'), newUpdate);
    }
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
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    deleteDocumentNonBlocking(projectRef);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast({ title: 'Project Deleted', description: 'The project and all its tasks have been removed.' });
    router.push('/projects');
  };

  const updateProject = (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team' | 'coverImage'>>) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    updateDocumentNonBlocking(projectRef, projectData);
    const project = projects.find(p => p.id === projectId);
    if(project) {
        addNotification(`Project "${project.name}" has been updated.`, projectId);
    }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...projectData } : p));
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
        isLoading,
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

    