'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, ProjectFile, Notification, TaskRemark, PackageName, ProjectStatus, TimerSession, Chat, ChatMessage } from '@/lib/types';
import { users as initialUsers, clients as initialClients, projects as initialProjects, tasks as initialTasks } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useCollection, setDocumentNonBlocking, useFirebaseServices } from '@/firebase';
import { collection, doc, query, where, Timestamp, writeBatch, serverTimestamp, arrayUnion, runTransaction, getDocs, updateDoc, addDoc, getDoc, orderBy, setDoc } from 'firebase/firestore';
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
  notifications: Notification[];
  timerSessions: TimerSession[];
  chats: Chat[];
  getOrCreateChat: (partnerId: string) => Promise<string | null>;
  sendMessage: (chatId: string, messageText: string, mediaUrl?: string) => void;
  addProject: (project: Omit<Project, 'id' | 'coverImage' >) => void;
  addTask: (task: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks' | 'dueDate'>) => void;
  updateProjectTeam: (projectId: string, teamMemberIds: string[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, remark: string) => void;
  addClient: (clientData: Omit<Client, 'id' | 'avatar'>) => void;
  updateClient: (clientId: string, clientData: Partial<Client>) => Promise<void>;
  addTeamMember: (memberData: {
    name: string;
    email: string;
  }) => void;
  updateTeamMember: (userId: string, memberData: Partial<User>) => void;
  addScrumUpdate: (update: Omit<ScrumUpdate, 'id' | 'timestamp'>) => void;
  addTimerSession: (session: Omit<TimerSession, 'id'>) => void;
  isLoading: boolean;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team_ids' | 'coverImage'>>) => void;
  addFile: (file: Omit<ProjectFile, 'id'>) => void;
  deleteFile: (fileId: string) => void;
  addNotification: (message: string, url: string, recipients: string[], type: 'system' | 'chat', chatId?: string) => void;
  markNotificationsAsRead: (type?: 'system' | 'chat') => void;
  markChatNotificationsAsRead: (chatId: string) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children, user: currentUser }: { children: React.ReactNode, user:User }) {
  const { toast } = useToast();
  const router = useRouter();
  const { firestore, auth, firebaseApp } = useFirebaseServices();
  
  const { data: usersData, isLoading: usersLoading } = useCollection<User>(useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]));

  const addNotification = useCallback((message: string, url: string, recipients: string[], type: 'system' | 'chat' = 'system', chatId?: string) => {
    if (!firestore || recipients.length === 0) return;
    const newNotif: Omit<Notification, 'id'> = {
      message,
      url,
      recipients,
      readBy: [],
      timestamp: Timestamp.now(),
      type,
      ...(chatId && { chatId }),
    };
    addDocumentNonBlocking(collection(firestore, 'notifications'), newNotif);
    
  }, [firestore]);
  
  const { data: projectsData, isLoading: projectsLoading } = useCollection<Project>(useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]));
  const { data: tasksData, isLoading: tasksLoading } = useCollection<Task>(useMemoFirebase(() => firestore ? collection(firestore, 'tasks') : null, [firestore]));
  const { data: files, isLoading: filesLoading } = useCollection<ProjectFile>(useMemoFirebase(() => firestore ? query(collection(firestore, 'files')) : null, [firestore]));
  const { data: clientsData, isLoading: clientsLoading } = useCollection<Client>(useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]));
  const { data: scrumUpdatesData, isLoading: scrumUpdatesLoading } = useCollection<ScrumUpdate>(useMemoFirebase(() => firestore ? collection(firestore, 'scrum-updates') : null, [firestore]));

  const timerSessionsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    
    if (currentUser.role === 'admin') {
      // Admins see all sessions, ordered by date
      return query(collection(firestore, 'timer-sessions'), orderBy('startTime', 'desc'));
    }
    
    // Non-admins only see their own sessions
    return query(
      collection(firestore, 'timer-sessions'), 
      where('userId', '==', currentUser.id),
      orderBy('startTime', 'desc')
    );
  }, [firestore, currentUser]);
  
  const { data: timerSessions, isLoading: timerSessionsLoading } = useCollection<TimerSession>(timerSessionsQuery);
  
  const { data: notificationsData = [], isLoading: notificationsLoading } = useCollection<Notification>(useMemoFirebase(() => {
    if (!firestore || !currentUser || !auth?.currentUser) return null;
    return query(collection(firestore, 'notifications'), where('recipients', 'array-contains', auth.currentUser.uid));
  }, [firestore, currentUser, auth]));
  
  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser || !auth?.currentUser) return null;
    return query(
      collection(firestore, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );
  }, [firestore, currentUser, auth]);
  
  const { data: chatsData, isLoading: chatsLoading } = useCollection<Chat>(chatsQuery);

  const isLoading = projectsLoading || tasksLoading || usersLoading || clientsLoading || filesLoading || notificationsLoading || scrumUpdatesLoading || timerSessionsLoading || chatsLoading;
  
  const teamEditorMapping = useMemo(() => {
    if (!usersData) return new Map<string, string>();
    const mapping = new Map<string, string>();
    let editorCount = 1;
    usersData
      .filter(u => u.role === 'team' || u.role === 'admin')
      .forEach(u => {
        const name = `Editor ${'\'\'\'editorCount++\'\'\''}`;
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
  
  const clients = useMemo(() => {
    if (!clientsData || !projectsData) return initialClients;
    return clientsData.map(c => {
        const projectCount = projectsData.filter(p => p.client.id === c.id).length;
        return {
            ...c,
            reelsCreated: projectCount,
        }
    });
  }, [clientsData, projectsData]);

  const projects = useMemo(() => {
    if (!projectsData || !clients) return initialProjects;
    return projectsData.map(p => {
        const client = clients.find(c => c.id === (p.client as unknown as { id: string }).id);
        return {
            ...p,
            client: client || p.client,
            team_ids: p.team_ids || [],
            startDate: p.startDate || format(new Date(), 'yyyy-MM-dd'),
        };
    }).filter(p => p.client);
  }, [projectsData, clients]);

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
    
  const notifications = notificationsData;
  const chats = chatsData || [];
  const scrumUpdates = scrumUpdatesData ? [...scrumUpdatesData].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

  const getOrCreateChat = useCallback(async (partnerId: string): Promise<string | null> => {
    if (!firestore || !currentUser || !auth?.currentUser) return null;

    const authUid = auth.currentUser.uid;
    const sortedIds = [authUid, partnerId].sort();
    const chatId = sortedIds.join('_');
    const chatDocRef = doc(firestore, 'chats', chatId);

    const docSnap = await getDoc(chatDocRef);
    if (docSnap.exists()) {
      return chatId;
    } else {
      try {
        await setDoc(chatDocRef, {
          id: chatId,
          type: 'direct',
          participants: sortedIds,
          createdBy: authUid,
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageAt: serverTimestamp(),
        });
        return chatId;
      } catch (error) {
        console.error("Error creating chat:", error);
        toast({ title: 'Chat Error', description: 'Could not create a new chat.', variant: 'destructive' });
        return null;
      }
    }
  }, [firestore, currentUser, auth, toast]);

  const sendMessage = useCallback((chatId: string, messageText: string, mediaUrl?: string) => {
    if (!currentUser || !firestore || (!messageText.trim() && !mediaUrl) || !auth?.currentUser) return;
    
    const authUid = auth.currentUser.uid;
    const messagesColRef = collection(firestore, 'chats', chatId, 'messages');
    const chatDocRef = doc(firestore, 'chats', chatId);

    const messagePayload: Omit<ChatMessage, 'id' | 'timestamp'> = {
      senderId: authUid,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      type: mediaUrl ? 'media' : 'text',
      text: messageText,
      mediaURL: mediaUrl || null,
      readBy: [authUid],
      deleted: false,
    };
    
    addDoc(messagesColRef, { ...messagePayload, timestamp: serverTimestamp() });
    
    updateDoc(chatDocRef, {
      lastMessage: {
        text: messageText,
        senderId: authUid,
        senderName: currentUser.name,
        type: mediaUrl ? 'media' : 'text',
        timestamp: serverTimestamp(),
      },
      lastMessageAt: serverTimestamp(),
    });

  }, [currentUser, firestore, auth]);

  const addProject = async (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    if (!firestore || !currentUser || !usersData) return;
    
    const clientRef = doc(firestore, 'clients', projectData.client.id);

    try {
        await runTransaction(firestore, async (transaction) => {
            const clientDoc = await transaction.get(clientRef);
            if (!clientDoc.exists()) {
                throw "Client document does not exist!";
            }

            const clientData = clientDoc.data() as Client;
            const reelsCreated = clientData.reelsCreated || 0;
            const reelsLimit = clientData.reelsLimit || 0;

            if (reelsCreated >= reelsLimit) {
                throw "This client has reached their project limit. Please upgrade their plan.";
            }
            
            const newProjectId = doc(collection(firestore, 'projects')).id;
            const newProject: Project = {
              id: newProjectId,
              ...projectData,
              coverImage: `project-${Math.ceil(Math.random() * 3)}`,
            };
            
            const projectRef = doc(firestore, 'projects', newProjectId);
            transaction.set(projectRef, newProject);
            transaction.update(clientRef, { reelsCreated: reelsCreated + 1 });
            
            const admins = usersData.filter(u => u.role === 'admin');
            const adminIds = admins.map(a => a.id).filter(id => id !== currentUser.id);

            const notificationRecipients = [
                ...(projectData.team_ids || []),
                ...adminIds
            ];
            
            if (notificationRecipients.length > 0) {
                addNotification(`New project '${'\'\'\'newProject.name\'\'\''}' was created by ${'\'\'\'currentUser.name\'\'\''}.`, `/projects/${'\'\'\'newProject.id\'\'\''}`, notificationRecipients, 'system');
            }
            
            if (projectData.team_ids.length > 0) {
                addNotification(`You have been assigned to the new project: '${'\'\'\'newProject.name\'\'\''}'.`, `/projects/${'\'\'\'newProject.id\'\'\''}`, projectData.team_ids, 'system');
            }
            router.push(`/projects/${newProject.id}`);
        });

    } catch (e: any) {
        console.error("Add project transaction failed: ", e);
        toast({
            title: 'Project Creation Failed',
            description: typeof e === 'string' ? e : e.message || 'Could not create the project due to an error.',
            variant: 'destructive',
        });
    }
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
    addNotification(`New task '${'\'\'\'newTask.title\'\'\''}' added to project '${'\'\'\'project.name\'\'\''}'.`, `/projects/${'\'\'\'project.id\'\'\''}`, finalRecipients, 'system');
  }

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    if (!projectsData || !firestore || !currentUser || !usersData) return;
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;
    
    const projectRef = doc(firestore, 'projects', projectId);
    updateDocumentNonBlocking(projectRef, { team_ids: teamMemberIds });
    
    toast({ title: 'Team Updated', description: `The team for "${'\'\'\'project.name\'\'\''}" has been updated.` });
    
    const adminIds = usersData.filter(u => u.role === 'admin').map(u => u.id);
    const recipients = Array.from(new Set([...teamMemberIds, project.client.id, ...adminIds]));
    addNotification(`The team for project '${'\'\'\'project.name\'\'\''}' has been updated.`, `/projects/${projectId}`, recipients.filter(id => id !== currentUser.id), 'system');
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
    let recipients: string[] = [];

    if (currentUser.role === 'admin') {
      recipients = [project.client.id, ...project.team_ids];
    } else if (currentUser.role === 'team') {
      recipients = [project.client.id, ...adminIds];
    } else { // client
      recipients = [...project.team_ids, ...adminIds];
    }
    const finalRecipients = Array.from(new Set(recipients)).filter(id => id !== currentUser.id);

    if (finalRecipients.length > 0) {
      addNotification(
          `Task '${'\'\'\'task.title\'\'\''}' in project '${'\'\'\'project.name\'\'\''}' was updated to '${status}'.`, 
          `/projects/${'\'\'\'project.id\'\'\''}`, 
          finalRecipients,
          'system'
      );
    }
  }

  const addClient = (clientData: Omit<Client, 'id' | 'avatar'>) => {
    if (!firestore) return;
    const newClientId = doc(collection(firestore, 'clients')).id;
    const newClient: Client = {
      id: newClientId,
      ...clientData,
      avatar: `avatar-${Math.floor(Math.random() * 3) + 2}`,
    };
    setDocumentNonBlocking(doc(firestore, 'clients', newClient.id), newClient, {});
  }
  
  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    if (!firestore || !usersData || !clients) return;
    const clientRef = doc(firestore, 'clients', clientId);
    await updateDocumentNonBlocking(clientRef, clientData);

    if (clientData.packageName) {
        const client = clients.find(c => c.id === clientId);
        const admins = usersData.filter(u => u.role === 'admin');

        if (client && admins.length > 0) {
            addNotification(
                `${'\'\'\'client.name\'\'\''}'s plan has been upgraded to ${'\'\'\'clientData.packageName\'\'\''}.`,
                `/settings/billing`,
                admins.map(a => a.id),
                'system'
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
      addNotification(`${'\'\'\'currentUser.name\'\'\''}'s daily scrum update has been submitted.`, `/scrum`, adminIds, 'system');
    }
  };

  const addTimerSession = (session: Omit<TimerSession, 'id'>) => {
    if (!firestore || !currentUser || !usersData) return;
    const newSessionId = doc(collection(firestore, 'timer-sessions')).id;
    const newSession: TimerSession = { id: newSessionId, ...session };
    setDocumentNonBlocking(doc(firestore, 'timer-sessions', newSession.id), newSession, {});
    
    const admins = usersData.filter(u => u.role === 'admin');
    if (admins.length > 0) {
        const adminIds = admins.map(a => a.id).filter(id => id !== currentUser.id);
        const action = session.endTime ? 'stopped' : 'started';
        addNotification(`${'\'\'\'currentUser.name\'\'\''}'s work timer has been ${action} for session: "${'\'\'\'session.name\'\'\''}".`, `/team`, adminIds, 'system');
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
            `Project '${'\'\'\'project.name\'\'\''}' status has been updated to '${'\'\'\'projectData.status\'\'\''}' by ${'\'\'\'currentUser.name\'\'\''}.`,
            `/projects/${projectId}`,
            [...clientRecipients, ...teamRecipients],
            'system'
        );
    }

    toast({ title: 'Project Updated', description: `Project "${'\'\'\'project.name\'\'\''}" has been updated.`});
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
  
  const deleteFile = (fileId: string) => {
    if (!firestore) return;
    const fileRef = doc(firestore, 'files', fileId);
    deleteDocumentNonBlocking(fileRef);
  };
  
  const markNotificationsAsRead = useCallback(async (type?: 'system' | 'chat') => {
    if (!firestore || !notifications || notifications.length === 0 || !currentUser) return;

    const unreadNotifications = notifications.filter(n => 
        !(n.readBy || []).includes(currentUser.id) &&
        (!type || n.type === type)
    );
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(firestore);
    unreadNotifications.forEach(notification => {
      const notifRef = doc(firestore, 'notifications', notification.id);
      batch.update(notifRef, { 
        readBy: arrayUnion(currentUser.id) 
      });
    });

    await batch.commit().catch(err => {
      console.error("Failed to mark notifications as read:", err);
    });
  }, [firestore, notifications, currentUser]);

  const markChatNotificationsAsRead = useCallback(async (chatId: string) => {
    if (!firestore || !currentUser) return;
    
    const q = query(
      collection(firestore, 'notifications'),
      where('chatId', '==', chatId),
      where('recipients', 'array-contains', currentUser.id)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;
    
    const batch = writeBatch(firestore);
    querySnapshot.docs.forEach(document => {
      const notif = document.data() as Notification;
      if (!notif.readBy.includes(currentUser.id)) {
        const notifRef = doc(firestore, 'notifications', document.id);
        batch.update(notifRef, {
          readBy: arrayUnion(currentUser.id)
        });
      }
    });

    await batch.commit().catch(err => {
      console.error(`Failed to mark chat ${chatId} as read:`, err);
    });
  }, [firestore, currentUser]);


  return (
    <DataContext.Provider value={{ 
        projects,
        tasks,
        clients,
        teamMembers, 
        users,
        scrumUpdates,
        files,
        notifications,
        chats,
        getOrCreateChat,
        sendMessage,
        timerSessions: timerSessions || [],
        addProject, 
        addTask, 
        updateProjectTeam, 
        updateTaskStatus,
        addClient,
        updateClient,
        addTeamMember,
        updateTeamMember,
        addScrumUpdate,
        addTimerSession,
        isLoading,
        deleteProject,
        updateProject,
        addFile,
        deleteFile,
        addNotification,
        markNotificationsAsRead,
        markChatNotificationsAsRead,
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
    