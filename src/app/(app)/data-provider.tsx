
'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, ProjectStatus, TaskRemark, ProjectFile, ChatMessage, Notification } from '@/lib/types';
import { users as initialUsers, clients as initialClients } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useCollection, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, Timestamp, writeBatch } from 'firebase/firestore';

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
  addProject: (project: Omit<Project, 'id' | 'coverImage' | 'team_ids'>) => void;
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
  updateProject: (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team' | 'coverImage'>>) => void;
  addFile: (file: Omit<ProjectFile, 'id'>) => void;
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  markNotificationsAsRead: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
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
  
  // Real-time data from Firestore
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    if (currentUser.role === 'admin') {
      return collection(firestore, 'projects');
    }
    if (currentUser.role === 'client') {
        return query(collection(firestore, 'projects'), where('client.id', '==', currentUser.id));
    }
    return query(collection(firestore, 'projects'), where('team_ids', 'array-contains', currentUser.id));
  }, [firestore, currentUser]);

  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser || !projects) return null;
    const projectIds = projects?.map(p => p.id) || [];
    if (projectIds.length === 0) return null; // No projects, no tasks to fetch.
    return query(collection(firestore, 'tasks'), where('projectId', 'in', projectIds));
  }, [firestore, currentUser, projects]);

  const { data: tasks = [], isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  
  const filesQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser || !projects) return null;
    const projectIds = projects?.map(p => p.id) || [];
    if (projectIds.length === 0) return null;
    return query(collection(firestore, 'files'), where('projectId', 'in', projectIds));
  }, [firestore, currentUser, projects]);

  const { data: files = [], isLoading: filesLoading } = useCollection<ProjectFile>(filesQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser || !projects) return null;
    const projectIds = projects?.map(p => p.id) || [];
    if (projectIds.length === 0) return null;
    return query(collection(firestore, 'messages'), where('projectId', 'in', projectIds));
  }, [firestore, currentUser, projects]);
  
  const { data: messages = [], isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);
    
  const { data: users = initialUsers, isLoading: usersLoading } = useCollection<User>(useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]));

  const { data: clients = initialClients, isLoading: clientsLoading } = useCollection<Client>(useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]));
  
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'notifications'), where('recipients', 'array-contains', currentUser.id));
  }, [firestore, currentUser]);
  
  const { data: notifications = [], isLoading: notificationsLoading } = useCollection<Notification>(notificationsQuery);


  const [scrumUpdates, setScrumUpdates] = useState<ScrumUpdate[]>([]);
  
  const isLoading = projectsLoading || tasksLoading || usersLoading || clientsLoading || filesLoading || messagesLoading || notificationsLoading;
  
  const teamMembers = useMemo(() => (users || []).filter(u => u.role === 'admin' || u.role === 'team'), [users]);
  
  const addProject = (projectData: Omit<Project, 'id' | 'coverImage' | 'team_ids'>) => {
    if (!firestore || !currentUser) return;
    const newProjectId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: newProjectId,
      ...projectData,
      team_ids: projectData.team.map(t => t.id),
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
    };
    setDocumentNonBlocking(doc(firestore, 'projects', newProject.id), newProject);

    const admin = users?.find(u => u.role === 'admin');
    if (admin) {
        addNotification(`New project '${newProject.name}' was created by ${currentUser.name}.`, newProject.id, [admin.id]);
    }

    router.push(`/projects/${newProject.id}`);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks'>) => {
    if (!firestore || !projects || !currentUser) return;
    const project = projects.find(p => p.id === taskData.projectId);
    const assignedTo = project?.team[0] || users.find(u => u.role === 'team') || users[0];
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
        const admin = users?.find(u => u.role === 'admin');
        const recipients = [project.client.id];
        if (admin) recipients.push(admin.id);
        addNotification(`New task '${newTask.title}' added to project '${project.name}'.`, project.id, recipients);
    }
  }

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    if (!projects || !firestore || !currentUser) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const newTeam = users.filter(u => teamMemberIds.includes(u.id));
    const projectRef = doc(firestore, 'projects', projectId);
    updateDocumentNonBlocking(projectRef, { team: newTeam, team_ids: teamMemberIds });
    
    toast({ title: 'Team Updated', description: `The team for "${project.name}" has been updated.` });
    
    // Notify team members and client
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
     const newMember: User = {
        id: newMemberId,
        name: memberData.name,
        email: memberData.email,
        aadharUrl: memberData.aadharUrl,
        panUrl: memberData.panUrl,
        joiningLetterUrl: memberData.joiningLetterUrl,
        role: 'team',
        username: memberData.name.toLowerCase().replace(/\s/g, ''),
        avatar: ''
     };
    setDocumentNonBlocking(doc(firestore, 'users', newMember.id), newMember);
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

  const updateProject = (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team' | 'coverImage'>>) => {
    if (!firestore || !projects) return;
    const projectRef = doc(firestore, 'projects', projectId);
    updateDocumentNonBlocking(projectRef, projectData);
    const project = projects.find(p => p.id === projectId);
    if(project) {
        toast({ title: 'Project Updated', description: `Project "${project.name}" has been updated.`});
    }
  };

  const addFile = (fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>) => {
    if (!firestore || !currentUser || !projects) return;
    const newFileId = `file-${Date.now()}`;
    const newFile: ProjectFile = {
      id: newFileId,
      ...fileData,
      uploadedAt: Timestamp.now(),
    };
    setDocumentNonBlocking(doc(firestore, 'files', newFile.id), newFile);
  }

  const addMessage = (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!firestore || !currentUser || !projects) return;
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
        projects: projects || [], 
        tasks: tasks || [], 
        clients: clients || [], 
        teamMembers, 
        users: users || [], 
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
