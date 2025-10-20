
'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, ProjectStatus, TaskRemark, ProjectFile, ChatMessage, Notification } from '@/lib/types';
import { users as initialUsers, clients as initialClients, projects as initialProjects, tasks as initialTasks } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useCollection, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, Timestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-client';

type DataContextType = {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  teamMembers: User[];
  users: User[];
  scrumUpdates: ScrumUpdate[];
  files: ProjectFile[];
  messages: ChatMessage[];
  notifications: Notification[];
  addProject: (project: Omit<Project, 'id' | 'coverImage' >) => void;
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
  isLoading: boolean;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team_ids' | 'coverImage'>>) => void;
  addFile: (file: Omit<ProjectFile, 'id'>) => void;
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  markNotificationsAsRead: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children, user: currentUser }: { children: React.ReactNode, user:User }) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const addNotification = useCallback((message: string, projectId: string, recipients: string[]) => {
    if (!firestore) return;
    const newNotif: Omit<Notification, 'id'> = {
      message,
      projectId,
      recipients,
      read: false,
      timestamp: Timestamp.now(),
    };
    addDocumentNonBlocking(collection(firestore, 'notifications'), newNotif);
  }, [firestore]);
  
  const { data: projectsData, isLoading: projectsLoading } = useCollection<Project>(useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]));
  const projects = projectsData || initialProjects;

  const { data: tasksData, isLoading: tasksLoading } = useCollection<Task>(useMemoFirebase(() => firestore ? collection(firestore, 'tasks') : null, [firestore]));
  const tasks = tasksData || initialTasks;
  
  const { data: filesData = [], isLoading: filesLoading } = useCollection<ProjectFile>(useMemoFirebase(() => firestore ? collection(firestore, 'files') : null, [firestore]));
  const files = filesData;

  const { data: messagesData = [], isLoading: messagesLoading } = useCollection<ChatMessage>(useMemoFirebase(() => firestore ? collection(firestore, 'messages') : null, [firestore]));
  const messages = messagesData;
    
  const { data: usersData, isLoading: usersLoading } = useCollection<User>(useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]));
  const users = usersData || initialUsers;

  const { data: clientsData, isLoading: clientsLoading } = useCollection<Client>(useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]));
  const clients = clientsData || initialClients;
  
  const { data: notificationsData = [], isLoading: notificationsLoading } = useCollection<Notification>(useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'notifications'), where('recipients', 'array-contains', currentUser.id));
  }, [firestore, currentUser]));
  const notifications = notificationsData;

  const [scrumUpdates, setScrumUpdates] = useState<ScrumUpdate[]>([]);
  
  const isLoading = projectsLoading || tasksLoading || usersLoading || clientsLoading || filesLoading || messagesLoading || notificationsLoading;
  
  const teamMembers = useMemo(() => (users || []).filter(u => u.role === 'admin' || u.role === 'team'), [users]);
  
  const addProject = (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    if (!firestore || !currentUser || !users) return;
    const newProjectId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: newProjectId,
      ...projectData,
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
    };
    setDocumentNonBlocking(doc(firestore, 'projects', newProject.id), newProject);

    const admin = users.find(u => u.role === 'admin');
    if (admin && currentUser.id !== admin.id) {
        addNotification(`New project '${newProject.name}' was created by ${currentUser.name}.`, newProject.id, [admin.id]);
    }

    router.push(`/projects/${newProject.id}`);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks'>) => {
    if (!firestore || !projects || !currentUser || !users) return;
    const project = projects.find(p => p.id === taskData.projectId);
    if (!project) return;
    const team = users.filter(u => project.team_ids.includes(u.id));
    const assignedTo = team[0] || users.find(u => u.role === 'team') || users[0];
    if (!assignedTo) {
        toast({title: "Error", description: "No one to assign task to."});
        return;
    }
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      ...taskData,
      assignedTo: assignedTo,
      status: 'Pending',
      remarks: [],
    };
    setDocumentNonBlocking(doc(firestore, 'tasks', newTask.id), newTask);

    if (project) {
        const admin = users.find(u => u.role === 'admin');
        const recipients = [project.client.id, ...project.team_ids];
        if (admin) recipients.push(admin.id);
        
        const finalRecipients = recipients.filter(id => id !== currentUser.id);
        addNotification(`New task '${newTask.title}' added to project '${project.name}'.`, project.id, finalRecipients);
    }
  }

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    if (!projects || !firestore || !currentUser || !users) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const projectRef = doc(firestore, 'projects', projectId);
    updateDocumentNonBlocking(projectRef, { team_ids: teamMemberIds });
    
    toast({ title: 'Team Updated', description: `The team for "${project.name}" has been updated.` });
    
    const recipients = [...teamMemberIds, project.client.id];
    addNotification(`The team for project '${project.name}' has been updated.`, projectId, recipients);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus, remark: string) => {
    if (!currentUser || !firestore || !tasks) return;

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
    
    const taskRef = doc(firestore, 'tasks', taskId);
    updateDocumentNonBlocking(taskRef, {
      status: status,
      remarks: [...task.remarks, newRemark]
    });
    
    toast({ title: 'Task Updated', description: `Task status changed to "${status}".` });
  }

  const addClient = (clientData: {name: string, company: string, email: string, founderDetails: string, agreementUrl?: string, idCardUrl?: string}) => {
    if (!firestore) return;
    const newClientId = `client-${Date.now()}`;
    const newClient: Client = {
      id: newClientId,
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
    setDocumentNonBlocking(doc(firestore, 'clients', newClient.id), newClient);
    setDocumentNonBlocking(doc(firestore, 'users', newUser.id), newUser);
  }
  
  const updateClient = (clientId: string, clientData: Partial<Client>) => {
    if (!firestore) return;
    const clientRef = doc(firestore, 'clients', clientId);
    updateDocumentNonBlocking(clientRef, clientData);
  }

  const addTeamMember = (memberData: { name: string, email: string, aadharUrl?: string, panUrl?: string, joiningLetterUrl?: string }) => {
    if (!firestore) return;
     const newMemberId = `user-${Date.now()}`;
     const newMember: Partial<User> = {
        id: newMemberId,
        name: memberData.name,
        email: memberData.email,
        role: 'team',
        username: memberData.name.toLowerCase().replace(/\s/g, ''),
        avatar: '',
        ...memberData,
     };

     Object.keys(newMember).forEach(keyStr => {
        const key = keyStr as keyof User;
        if (newMember[key] === undefined) {
            delete newMember[key];
        }
    });

    setDocumentNonBlocking(doc(firestore, 'users', newMemberId), newMember);
  }

  const updateTeamMember = (userId: string, memberData: Partial<User>) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, memberData);
  }

  const addScrumUpdate = (update: Omit<ScrumUpdate, 'id'>) => {
    if (!firestore) return;
    const newUpdate: ScrumUpdate = { ...update, id: `scrum-${Date.now()}`, timestamp: new Date().toISOString() };
    addDocumentNonBlocking(collection(firestore, 'scrum-updates'), newUpdate);
    setScrumUpdates(prev => [...prev, newUpdate]);
  };

  const deleteProject = (projectId: string) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    deleteDocumentNonBlocking(projectRef);
    toast({ title: 'Project Deleted', description: 'The project and all its tasks have been removed.' });
    router.push('/projects');
  };

  const updateProject = (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team_ids' | 'coverImage'>>) => {
    if (!firestore || !projects) return;
    const projectRef = doc(firestore, 'projects', projectId);
    updateDocumentNonBlocking(projectRef, projectData);
    const project = projects.find(p => p.id === projectId);
    if(project) {
        toast({ title: 'Project Updated', description: `Project "${project.name}" has been updated.`});
    }
  };

  const addFile = (fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>) => {
    if (!firestore || !currentUser) return;
    const newFileId = `file-${Date.now()}`;
    const newFile: ProjectFile = {
      id: newFileId,
      ...fileData,
      uploadedAt: Timestamp.now(),
    };
    setDocumentNonBlocking(doc(firestore, 'files', newFile.id), newFile);
  }

  const addMessage = (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!firestore || !currentUser) return;
    const newMessageId = `msg-${Date.now()}`;
    const newMessage: ChatMessage = {
      id: newMessageId,
      ...messageData,
      timestamp: Timestamp.now(),
    };
    setDocumentNonBlocking(doc(firestore, 'messages', newMessage.id), newMessage);
  }
  
  const markNotificationsAsRead = useCallback(() => {
    if (!firestore || !notifications || notifications.length === 0) return;

    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(firestore);
    unreadNotifications.forEach(notification => {
      const notifRef = doc(firestore, 'notifications', notification.id);
      batch.update(notifRef, { read: true });
    });

    batch.commit().catch(err => {
      console.error("Failed to mark notifications as read:", err);
    });
  }, [firestore, notifications]);


  return (
    <DataContext.Provider value={{ 
        projects,
        tasks,
        clients,
        teamMembers, 
        users,
        scrumUpdates,
        files,
        messages,
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
        isLoading,
        deleteProject,
        updateProject,
        addFile,
        addMessage,
        markNotificationsAsRead,
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
