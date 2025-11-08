
'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, ProjectFile, ChatMessage, Notification, TaskRemark, MessageType, PackageName, ProjectStatus } from '@/lib/types';
import { users as initialUsers, clients as initialClients, projects as initialProjects, tasks as initialTasks } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useCollection, setDocumentNonBlocking, useFirebaseServices } from '@/firebase';
import { collection, doc, query, where, Timestamp, writeBatch, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/firebase/provider';
import { uploadFile } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import type { FirebaseApp } from 'firebase/app';
import { packages as subscriptionPackages } from './settings/billing/packages-data';
import { format, addWeeks } from 'date-fns';

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
  addTask: (task: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks' | 'dueDate'>) => void;
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
  }) => void;
  updateTeamMember: (userId: string, memberData: Partial<User>) => void;
  addScrumUpdate: (update: Omit<ScrumUpdate, 'id' | 'timestamp'>) => void;
  isLoading: boolean;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team_ids' | 'coverImage'>>) => void;
  addFile: (file: Omit<ProjectFile, 'id'>) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  markNotificationsAsRead: () => void;
  uploadAndAddMessage: (projectId: string, audioBlob: Blob) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children, user: currentUser }: { children: React.ReactNode, user:User }) {
  const { toast } = useToast();
  const router = useRouter();
  const { firestore, auth, firebaseApp } = useFirebaseServices();
  
  const { data: usersData, isLoading: usersLoading } = useCollection<User>(useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]));

  const addNotification = useCallback((message: string, projectId: string, recipients: string[]) => {
    if (!firestore || recipients.length === 0 || !usersData) return;
    const newNotif: Omit<Notification, 'id'> = {
      message,
      projectId,
      recipients,
      readBy: [],
      timestamp: Timestamp.now(),
    };
    addDocumentNonBlocking(collection(firestore, 'notifications'), newNotif);
    
  }, [firestore, usersData]);
  
  const { data: projectsData, isLoading: projectsLoading } = useCollection<Project>(useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]));
  const { data: tasksData, isLoading: tasksLoading } = useCollection<Task>(useMemoFirebase(() => firestore ? collection(firestore, 'tasks') : null, [firestore]));
  const { data: files, isLoading: filesLoading } = useCollection<ProjectFile>(useMemoFirebase(() => firestore ? collection(firestore, 'files') : null, [firestore]));
  const { data: messagesData, isLoading: messagesLoading } = useCollection<ChatMessage>(useMemoFirebase(() => firestore ? collection(firestore, 'messages') : null, [firestore]));
  const { data: clientsData, isLoading: clientsLoading } = useCollection<Client>(useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]));
  const { data: scrumUpdatesData, isLoading: scrumUpdatesLoading } = useCollection<ScrumUpdate>(useMemoFirebase(() => firestore ? collection(firestore, 'scrum-updates') : null, [firestore]));
  
  const { data: notificationsData = [], isLoading: notificationsLoading } = useCollection<Notification>(useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'notifications'), where('recipients', 'array-contains', currentUser.id));
  }, [firestore, currentUser]));
  
  const isLoading = projectsLoading || tasksLoading || usersLoading || clientsLoading || filesLoading || messagesLoading || notificationsLoading || scrumUpdatesLoading;
  
  const teamEditorMapping = useMemo(() => {
    if (!usersData) return new Map<string, string>();
    const mapping = new Map<string, string>();
    let editorCount = 1;
    usersData
      .filter(u => u.role === 'team' || u.role === 'admin')
      .forEach(u => {
        const name = `Editor ${editorCount++}`;
        mapping.set(u.id, name);
      });
    return mapping;
  }, [usersData]);

  const anonymizeUser = useCallback((userToAnonymize: User) => {
    if (currentUser?.role === 'client' && userToAnonymize && (userToAnonymize.role === 'team' || userToAnonymize.role === 'admin')) {
      return {
        ...userToAnonymize,
        name: teamEditorMapping.get(userToAnonymize.id) || 'Editor',
        avatar: 'avatar-generic'
      };
    }
    return userToAnonymize;
  }, [currentUser?.role, teamEditorMapping]);
  
  const users = useMemo(() => {
    if (!usersData) return initialUsers;
    if (currentUser?.role !== 'client') return usersData;
    return usersData.map(anonymizeUser);
  }, [usersData, currentUser?.role, anonymizeUser]);

  const teamMembers = useMemo(() => (usersData || []).filter(u => u.role === 'admin' || u.role === 'team'), [usersData]);
  
  const projects = useMemo(() => {
    if (!projectsData || !clientsData) return initialProjects;
    return projectsData.map(p => {
        const client = clientsData.find(c => c.id === (p.client as unknown as string));
        return {
            ...p,
            client: client || p.client,
            team_ids: p.team_ids || [],
            startDate: p.startDate || format(new Date(), 'yyyy-MM-dd'),
        };
    }).filter(p => p.client);
  }, [projectsData, clientsData]);

  const tasks = useMemo(() => {
    if (!tasksData) return initialTasks;
    return tasksData.map(t => {
      const project = projects.find(p => p.id === t.projectId);
      const dueDate = t.dueDate || format(addWeeks(new Date(project?.startDate || Date.now()), 1), 'yyyy-MM-dd');
      
      const anonymizedTask = {
          ...t,
          dueDate,
          assignedTo: t.assignedTo,
          remarks: t.remarks || [],
      };

      if (currentUser?.role === 'client') {
          anonymizedTask.assignedTo = anonymizeUser(t.assignedTo);
          anonymizedTask.remarks = (t.remarks || []).map(r => ({
              ...r,
              userName: teamEditorMapping.get(r.userId) || 'Editor',
          }));
      }

      return anonymizedTask;
    });
  }, [tasksData, projects, currentUser, anonymizeUser, teamEditorMapping]);
  
  const messages = useMemo(() => {
    if (!messagesData) return [];
    const uniqueMessages = Array.from(new Map(messagesData.map(m => [m.id, m])).values());
    const sorted = uniqueMessages.sort((a,b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
    if (currentUser?.role !== 'client') return sorted;
    
    return sorted.map(m => {
        const sender = usersData?.find(u => u.id === m.senderId);
        // Anonymize team members and admins
        if (sender && (sender.role === 'team' || sender.role === 'admin')) {
            return {
                ...m,
                senderName: teamEditorMapping.get(m.senderId) || 'Editor',
                senderAvatar: 'avatar-generic'
            }
        }
        // Handle reply-to anonymization
        if (m.replyTo) {
            const replySender = usersData?.find(u => u.name === m.replyTo?.senderName);
            if (replySender && (replySender.role === 'team' || replySender.role === 'admin')) {
                return {
                    ...m,
                    replyTo: {
                        ...m.replyTo,
                        senderName: teamEditorMapping.get(replySender.id) || 'Editor',
                    }
                }
            }
        }
        return m;
    })

  }, [messagesData, currentUser?.role, usersData, teamEditorMapping]);
    
  const clients = useMemo(() => {
    if (!clientsData) return initialClients;
    const defaultPackage = subscriptionPackages.find(p => p.name === 'Gold');
    const defaultTier = defaultPackage?.tiers?.[0];
    const durationString = defaultTier?.duration || defaultPackage?.duration;
    const maxDuration = durationString ? parseInt(durationString.replace(/[^0-9]/g, ''), 10) : 90;
    
    return clientsData.map(c => ({
      ...c,
      packageName: c.packageName || 'Gold',
      reelsLimit: c.reelsLimit ?? defaultTier?.reels ?? 10,
      reelsCreated: c.reelsCreated ?? 0,
      maxDuration: c.maxDuration ?? (isNaN(maxDuration) ? 90 : maxDuration),
    }));
  }, [clientsData]);

  const notifications = notificationsData;
  const scrumUpdates = scrumUpdatesData ? [...scrumUpdatesData].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

  const addProject = (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    if (!firestore || !currentUser || !usersData) return;
    const newProjectId = doc(collection(firestore, 'projects')).id;
    const newProject: Project = {
      id: newProjectId,
      ...projectData,
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
    };
    setDocumentNonBlocking(doc(firestore, 'projects', newProject.id), newProject, {});
    
    // Update client's reel count
    const clientRef = doc(firestore, 'clients', newProject.client.id);
    const client = clients.find(c => c.id === newProject.client.id);
    if(client) {
      updateDocumentNonBlocking(clientRef, { reelsCreated: (client.reelsCreated || 0) + 1 });
    }

    const admins = usersData.filter(u => u.role === 'admin');
    const adminIds = admins.map(a => a.id).filter(id => id !== currentUser.id);

    const notificationRecipients = [
        ...(projectData.team_ids || []),
        ...adminIds
    ];
    
    if (notificationRecipients.length > 0) {
        addNotification(`New project '${newProject.name}' was created by ${currentUser.name}.`, newProject.id, notificationRecipients);
    }
    
    if (projectData.team_ids.length > 0) {
        addNotification(`You have been assigned to the new project: '${newProject.name}'.`, newProject.id, projectData.team_ids);
    }

    router.push(`/projects/${newProject.id}`);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks' | 'dueDate'>) => {
    if (!firestore || !projects || !currentUser || !usersData) return;
    const project = projects.find(p => p.id === taskData.projectId);
    if (!project) return;
    
    const assignedToId = project.team_ids[0] || (teamMembers.find(tm => tm.id !== currentUser.id))?.id || currentUser.id;
    const assignedTo = usersData?.find(u => u.id === assignedToId);

    if (!assignedTo) {
        toast({title: "Error", description: "No one available to assign the task to.", variant: 'destructive'});
        return;
    }
    const newTaskId = doc(collection(firestore, 'tasks')).id;
    const newTask: Omit<Task, 'id'> & { id: string } = {
      id: newTaskId,
      ...taskData,
      assignedTo: assignedTo,
      status: 'Pending',
      remarks: [],
      dueDate: format(addWeeks(new Date(project.startDate), 1), 'yyyy-MM-dd'),
    };
    setDocumentNonBlocking(doc(firestore, 'tasks', newTask.id), newTask, {});

    const adminIds = usersData.filter(u => u.role === 'admin').map(u => u.id);
    const recipients = Array.from(new Set([project.client.id, ...project.team_ids, ...adminIds]));
    const finalRecipients = recipients.filter(id => id !== currentUser.id);
    addNotification(`New task '${newTask.title}' added to project '${project.name}'.`, project.id, finalRecipients);
  }

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    if (!projectsData || !firestore || !currentUser || !usersData) return;
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;
    
    const projectRef = doc(firestore, 'projects', projectId);
    updateDocumentNonBlocking(projectRef, { team_ids: teamMemberIds });
    
    toast({ title: 'Team Updated', description: `The team for "${project.name}" has been updated.` });
    
    const adminIds = usersData.filter(u => u.role === 'admin').map(u => u.id);
    const recipients = Array.from(new Set([...teamMemberIds, project.client.id, ...adminIds]));
    addNotification(`The team for project '${project.name}' has been updated.`, projectId, recipients.filter(id => id !== currentUser.id));
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus, remark: string) => {
    if (!currentUser || !firestore || !tasksData || !projectsData || !usersData) return;

    const task = tasksData?.find(t => t.id === taskId);
    if (!task) return;
    const project = projectsData?.find(p => p.id === task.projectId);
    if(!project) return;

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
      remarks: [...(task.remarks || []), newRemark]
    });
    
    toast({ title: 'Task Updated', description: `Task status changed to "${status}".` });
    
    const adminIds = usersData.filter(u => u.role === 'admin').map(u => u.id);
    const recipients = Array.from(new Set([project.client.id, ...project.team_ids, ...adminIds]));
    addNotification(`Task '${task.title}' in project '${project.name}' was updated to '${status}'.`, project.id, recipients.filter(id => id !== currentUser.id));
  }

  const addClient = (clientData: {name: string, company: string, email: string, founderDetails: string, agreementUrl?: string, idCardUrl?: string}) => {
    if (!firestore) return;
    const newClientId = doc(collection(firestore, 'clients')).id;
    const newClient: Client = {
      id: newClientId,
      ...clientData,
      avatar: `avatar-${Math.floor(Math.random() * 3) + 2}`,
    };
    setDocumentNonBlocking(doc(firestore, 'clients', newClient.id), newClient, {});
  }
  
  const updateClient = (clientId: string, clientData: Partial<Client>) => {
    if (!firestore || !usersData || !clientsData) return;
    const clientRef = doc(firestore, 'clients', clientId);
    updateDocumentNonBlocking(clientRef, clientData);

    if (clientData.packageName) {
        const client = clientsData.find(c => c.id === clientId);
        const admins = usersData.filter(u => u.role === 'admin');

        if (client && admins.length > 0) {
            addNotification(
                `${client.name} has upgraded their plan to ${clientData.packageName}.`,
                'general',
                admins.map(a => a.id)
            );
        }
    }
  }

  const addTeamMember = (memberData: { name: string, email: string }) => {
    if (!firestore) return;
     console.log("Adding new team member (placeholder):", memberData);
  }

  const updateTeamMember = (userId: string, memberData: Partial<User>) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, memberData);
  }

  const addScrumUpdate = (update: Omit<ScrumUpdate, 'id' | 'timestamp'>) => {
    if (!firestore || !currentUser || !usersData) return;
    const newUpdate: Omit<ScrumUpdate, 'id'> = { ...update, timestamp: new Date().toISOString() };
    addDocumentNonBlocking(collection(firestore, 'scrum-updates'), newUpdate);

    const admins = usersData.filter(u => u.role === 'admin');
    if (admins.length > 0) {
      const adminIds = admins.map(a => a.id).filter(id => id !== currentUser.id);
      addNotification(`${currentUser.name} has submitted their daily scrum update.`, 'general', adminIds);
    }
  };

  const deleteProject = (projectId: string) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    deleteDocumentNonBlocking(projectRef);
    toast({ title: 'Project Deleted', description: 'The project and all its tasks have been removed.' });
    router.push('/projects');
  };

  const updateProject = (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team_ids' | 'coverImage'>>) => {
    if (!firestore || !projects || !currentUser || !usersData) return;
    const projectRef = doc(firestore, 'projects', projectId);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    updateDocumentNonBlocking(projectRef, projectData);
    
    if (projectData.status && project.status !== projectData.status) {
        const clientRecipients = [project.client.id];
        const teamRecipients = project.team_ids.filter(id => id !== currentUser.id);

        addNotification(
            `Project '${project.name}' status has been updated to '${projectData.status}' by ${currentUser.name}.`,
            projectId,
            [...clientRecipients, ...teamRecipients]
        );
    }

    toast({ title: 'Project Updated', description: `Project "${project.name}" has been updated.`});
  };

  const addFile = (fileData: Omit<ProjectFile, 'id'>) => {
    if (!firestore || !currentUser) return;
    const newFileId = doc(collection(firestore, 'files')).id;
    const newFile: ProjectFile = {
      id: newFileId,
      ...fileData,
      uploadedAt: Timestamp.now(),
    };
    setDocumentNonBlocking(doc(firestore, 'files', newFile.id), newFile, {});
  }

  const addMessage = useCallback((messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!firestore || !currentUser || !usersData || !projectsData) return;
    
    const finalMessageData = {
        ...messageData,
        timestamp: serverTimestamp()
    };

    const newMessageId = doc(collection(firestore, 'messages')).id;
    setDocumentNonBlocking(doc(firestore, 'messages', newMessageId), finalMessageData, {});

    const project = projectsData.find(p => p.id === messageData.projectId);
    if (project) {
      const adminIds = usersData.filter(u => u.role === 'admin').map(u => u.id);
      const recipients = Array.from(new Set([project.client.id, ...project.team_ids, ...adminIds]));
      const finalRecipients = recipients.filter(id => id !== currentUser.id);
      let messageSnippet = '';
      if (messageData.messageType === 'file') {
        messageSnippet = 'Sent a file';
      } else if (messageData.messageType === 'voice') {
        messageSnippet = 'Sent a voice message';
      }
      else {
        messageSnippet = `"${messageData.message.substring(0, 30)}..."`;
      }
      addNotification(`New message in project '${project.name}': ${messageSnippet}`, project.id, finalRecipients);
    }
  }, [firestore, currentUser, usersData, projectsData, addNotification]);

  const uploadAndAddMessage = async (projectId: string, audioBlob: Blob) => {
    if (!currentUser || !firebaseApp) return;
  
    try {
      const url = await uploadFile(
        audioBlob,
        `voice-messages/${projectId}/${uuidv4()}.webm`
      );
  
      addMessage({
        projectId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar || '',
        message: '🎤 Voice message',
        fileUrl: url,
        messageType: 'voice',
      });
  
    } catch (error) {
      console.error("Upload and add message failed:", error);
      toast({ title: "Upload failed", description: "Could not send voice message.", variant: 'destructive' });
      throw error;
    }
  };
  
  const markNotificationsAsRead = useCallback(() => {
    if (!firestore || !notifications || notifications.length === 0 || !currentUser) return;

    const unreadNotifications = notifications.filter(n => !(n.readBy || []).includes(currentUser.id));
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(firestore);
    unreadNotifications.forEach(notification => {
      const notifRef = doc(firestore, 'notifications', notification.id);
      batch.update(notifRef, { 
        readBy: arrayUnion(currentUser.id) 
      });
    });

    batch.commit().catch(err => {
      console.error("Failed to mark notifications as read:", err);
    });
  }, [firestore, notifications, currentUser]);


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
        uploadAndAddMessage,
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
