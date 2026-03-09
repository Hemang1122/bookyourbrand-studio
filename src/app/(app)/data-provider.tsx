
'use client';

import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, ProjectFile, Notification, TaskRemark, PackageName, ProjectStatus, TimerSession, Chat, ChatMessage, ClientDocument, ClientPackage } from '@/lib/types';
import { users as initialUsers, clients as initialClients, projects as initialProjects, tasks as initialTasks } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useCollection, setDocumentNonBlocking, useFirebaseServices, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, doc, query, where, Timestamp, writeBatch, arrayUnion, runTransaction, getDocs, updateDoc, addDoc, getDoc, orderBy, setDoc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/firebase/provider';
import { uploadFile, deleteFileFromStorage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { format, addWeeks } from 'date-fns';
import { httpsCallable } from 'firebase/functions';

type DataContextType = {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  teamMembers: User[];
  users: User[];
  scrumUpdates: ScrumUpdate[];
  files: ProjectFile[];
  clientDocuments: ClientDocument[];
  notifications: Notification[];
  timerSessions: TimerSession[];
  clientPackages: ClientPackage[];
  chats: Chat[];
  getOrCreateChat: (partnerId: string, isSupport?: boolean) => Promise<string | null>;
  sendMessage: (chatId: string, messageText: string, mediaUrl?: string, replyTo?: ChatMessage['replyTo']) => void;
  addProject: (project: Omit<Project, 'id' | 'coverImage' >) => void;
  addTask: (task: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks' | 'dueDate'>) => void;
  deleteTask: (taskId: string) => void;
  updateProjectTeam: (projectId: string, teamMemberIds: string[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, remark: string) => void;
  createUser: (userData: { name: string; role: 'client' | 'team', realEmail?: string; company?: string; }) => Promise<any>;
  deleteUser: (userId: string) => Promise<any>;
  updateClient: (clientId: string, clientData: Partial<Client>) => Promise<void>;
  selectPackage: (packageData: Omit<ClientPackage, 'id' | 'startDate' | 'reelsUsed' | 'status' | 'clientId'>) => Promise<void>;
  updateTeamMember: (userId: string, memberData: Partial<User>) => void;
  addScrumUpdate: (update: Omit<ScrumUpdate, 'id' | 'timestamp'>) => void;
  addTimerSession: (session: Omit<TimerSession, 'id'>) => void;
  isLoading: boolean;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team_ids' | 'coverImage'>>) => void;
  addFile: (file: Omit<ProjectFile, 'id'>) => void;
  updateFile: (fileId: string, data: Partial<ProjectFile>) => void;
  deleteFile: (fileId: string) => void;
  addClientDocument: (document: Omit<ClientDocument, 'id' | 'uploadedAt' | 'uploadedById' | 'url' | 'storagePath' | 'fileName'>, file: File) => Promise<void>;
  deleteClientDocument: (document: ClientDocument) => Promise<void>;
  addNotification: (message: string, url: string, recipients: string[], type: 'system' | 'chat', chatId?: string) => void;
  markNotificationsAsRead: (type?: 'system' | 'chat') => void;
  markChatNotificationsAsRead: (chatId: string) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children, user: currentUser }: { children: React.ReactNode, user:User }) {
  const { firestore, auth, functions } = useFirebaseServices();
  const { toast } = useToast();
  const router = useRouter();
  const authUid = auth?.currentUser?.uid ?? null;
  
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
    
    addDoc(collection(firestore, 'notifications'), newNotif).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'notifications',
        operation: 'create',
        requestResourceData: newNotif,
      }));
    });
  }, [firestore]);
  
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    const ref = collection(firestore, 'projects');
    if (currentUser.role === 'admin') return ref;
    if (currentUser.role === 'client') {
      return query(ref, where('client.id', '==', currentUser.id));
    }
    if (currentUser.role === 'team') {
      return query(ref, where('team_ids', 'array-contains', currentUser.id));
    }
    return null;
  }, [firestore, currentUser?.id, currentUser?.role]);

  const { data: projectsData, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const { data: tasksData, isLoading: tasksLoading } = useCollection<Task>(useMemoFirebase(() => firestore ? collection(firestore, 'tasks') : null, [firestore]));
  const { data: files, isLoading: filesLoading } = useCollection<ProjectFile>(useMemoFirebase(() => firestore ? query(collection(firestore, 'files')) : null, [firestore]));
  
  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    const ref = collection(firestore, 'clients');
    if (currentUser.role === 'admin') return ref;
    if (currentUser.role === 'client') {
      return query(ref, where('id', '==', currentUser.id));
    }
    return ref; 
  }, [firestore, currentUser?.id, currentUser?.role]);

  const { data: clientsData, isLoading: clientsLoading } = useCollection<Client>(clientsQuery);

  const { data: clientPackages, isLoading: clientPackagesLoading } = useCollection<ClientPackage>(useMemoFirebase(() => firestore ? query(collection(firestore, 'client-packages'), orderBy('createdAt', 'desc')) : null, [firestore]));
  
  const { data: clientDocuments, isLoading: documentsLoading } = useCollection<ClientDocument>(useMemoFirebase(() => firestore ? collection(firestore, 'clientDocuments') : null, [firestore]));

  const { data: scrumUpdatesData, isLoading: scrumUpdatesLoading } = useCollection<ScrumUpdate>(useMemoFirebase(() => {
    if (!firestore || !currentUser || currentUser.role === 'client') return null;
    return collection(firestore, 'scrum-updates');
  }, [firestore, currentUser]));

  const timerSessionsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser || !authUid) return null;
    if (currentUser.role === 'admin') return query(collection(firestore, 'timer-sessions'), orderBy('startTime', 'desc'));
    return query(collection(firestore, 'timer-sessions'), where('userId', '==', authUid), orderBy('startTime', 'desc'));
  }, [firestore, currentUser, authUid]);
  
  const { data: timerSessions, isLoading: timerSessionsLoading } = useCollection<TimerSession>(timerSessionsQuery);
  
  const { data: notificationsData = [], isLoading: notificationsLoading } = useCollection<Notification>(useMemoFirebase(() => {
    if (!firestore || !authUid) return null;
    return query(collection(firestore, 'notifications'), where('recipients', 'array-contains', authUid));
  }, [firestore, authUid]));
  
  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !authUid || !currentUser) return null;
    
    // IMPORTANT: Only query chats for clients in global state.
    // Admins and team members access chats differently (e.g., on-demand on the support page)
    if (currentUser.role === 'admin' || currentUser.role === 'team') {
      return null;
    }
    
    return query(
      collection(firestore, 'chats'), 
      where('participants', 'array-contains', authUid), 
      orderBy('lastMessageAt', 'desc')
    );
  }, [firestore, authUid, currentUser]);
  
  const { data: chatsData, isLoading: chatsLoading } = useCollection<Chat>(chatsQuery);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!chatsData || !firestore || !authUid) return;
    const unsubscribes = chatsData.map(chat => {
      const messagesQuery = query(collection(firestore, 'chats', chat.id, 'messages'));
      return onSnapshot(messagesQuery, (snapshot) => {
        let count = 0;
        snapshot.forEach(doc => {
          const message = doc.data() as ChatMessage;
          if (message.senderId !== authUid && !(message.readBy || []).includes(authUid)) count++;
        });
        setUnreadCounts(prev => ({ ...prev, [chat.id]: count }));
      });
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [chatsData, firestore, authUid]);

  const isLoading = projectsLoading || tasksLoading || usersLoading || clientsLoading || filesLoading || notificationsLoading || scrumUpdatesLoading || timerSessionsLoading || (currentUser?.role === 'client' && chatsLoading) || documentsLoading || clientPackagesLoading;
  
  const teamEditorMapping = useMemo(() => {
    if (!usersData) return new Map<string, string>();
    const mapping = new Map<string, string>();
    let editorCount = 1;
    usersData.filter(u => u.role === 'team').forEach(u => mapping.set(u.id, `Editor ${editorCount++}`));
    return mapping;
  }, [usersData]);

  const anonymizeUser = useCallback((userToAnonymize: User) => {
    if (currentUser?.role === 'client' && userToAnonymize) {
      if (userToAnonymize.role === 'admin') return { ...userToAnonymize, name: 'Admin', avatar: 'avatar-generic' };
      if (userToAnonymize.role === 'team') return { ...userToAnonymize, name: teamEditorMapping.get(userToAnonymize.id) || 'Editor', avatar: 'avatar-generic' };
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
    return clientsData.map(c => ({
        ...c,
        reelsCreated: projectsData.filter(p => p.client.id === c.id && p.status !== 'Completed' && p.status !== 'Approved').length,
    }));
  }, [clientsData, projectsData]);

  const projects = useMemo(() => {
    if (!projectsData || !clients) return initialProjects;
    return projectsData.map(p => {
        const client = clients.find(c => c.id === (p.client as any).id);
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
    const accessibleProjectIds = new Set(projects.map(p => p.id));
    return tasksData.filter(t => accessibleProjectIds.has(t.projectId)).map(t => {
      const project = projects.find(p => p.id === t.projectId);
      const dueDate = t.dueDate || format(addWeeks(new Date(project?.startDate || Date.now()), 1), 'yyyy-MM-dd');
      const task = { ...t, dueDate, assignedTo: t.assignedTo, remarks: t.remarks || [] };
      if (currentUser?.role === 'client') {
          task.assignedTo = anonymizeUser(t.assignedTo);
          task.remarks = (t.remarks || []).map(r => {
            const remarkUser = usersData?.find(u => u.id === r.userId);
            return { ...r, userName: remarkUser ? anonymizeUser(remarkUser).name : r.userName };
          });
      }
      return task;
    });
  }, [tasksData, projects, currentUser, usersData, anonymizeUser]);

  const scrumUpdates = useMemo(() => scrumUpdatesData || [], [scrumUpdatesData]);
    
  const getOrCreateChat = useCallback(async (partnerId: string, isSupport: boolean = false): Promise<string | null> => {
    if (!firestore || !currentUser || !authUid) return null;
    
    const chatId = isSupport ? `support_${currentUser.id}` : [authUid, partnerId].sort().join('_');
    const chatDocRef = doc(firestore, 'chats', chatId);
    
    try {
        const docSnap = await getDoc(chatDocRef);
        if (docSnap.exists()) return chatId;
        
        const newChatData: Partial<Chat> = { 
          id: chatId, 
          type: isSupport ? 'support' : 'direct', 
          participants: isSupport ? ['support', currentUser.id] : [authUid, partnerId].sort(), 
          createdBy: authUid, 
          createdAt: Timestamp.now(), 
          lastMessage: null, 
          lastMessageAt: Timestamp.now(),
          ...(isSupport && { 
            clientId: currentUser.id, 
            clientName: currentUser.name,
            clientAvatar: currentUser.avatar
          })
        };
        
        await setDoc(chatDocRef, newChatData);
        
        if (!isSupport) {
          addNotification(`New chat with ${currentUser.name}.`, `/support?chatId=${chatId}`, [partnerId], 'chat', chatId);
        } else {
          // RESTRICTION: Only notify the admin named "Niddhi" for new support requests
          const niddhi = usersData?.find(u => u.role === 'admin' && u.name.toLowerCase().includes('niddhi'));
          const adminIds = niddhi ? [niddhi.id] : [];
          
          if (adminIds.length > 0) {
            addNotification(`New support request from ${currentUser.name}.`, `/support?chatId=${chatId}`, adminIds, 'chat', chatId);
          }
        }
        
        return chatId;
    } catch (serverError: any) {
        toast({ title: 'Chat Error', description: 'Could not access the chat.', variant: 'destructive' });
        return null;
    }
  }, [firestore, currentUser, authUid, toast, addNotification, usersData]);

  const sendMessage = useCallback(async (chatId: string, messageText: string, mediaUrl?: string, replyTo?: ChatMessage['replyTo']) => {
    if (!currentUser || !firestore || !authUid) return;
    const messagesColRef = collection(firestore, 'chats', chatId, 'messages');
    const chatDocRef = doc(firestore, 'chats', chatId);
    
    const messagePayload: Partial<ChatMessage> = { 
      senderId: authUid, 
      senderName: currentUser.name, 
      senderRole: currentUser.role, 
      senderAvatar: currentUser.photoURL || currentUser.avatar,
      type: mediaUrl ? 'media' : 'text', 
      text: messageText, 
      mediaURL: mediaUrl || null, 
      readBy: [authUid], 
      deleted: false, 
      ...(replyTo && { replyTo }) 
    };
    
    addDocumentNonBlocking(messagesColRef, { ...messagePayload, timestamp: serverTimestamp() });
    updateDocumentNonBlocking(chatDocRef, { 
      lastMessage: { 
        text: messageText, 
        senderId: authUid, 
        senderName: currentUser.name, 
        type: mediaUrl ? 'media' : 'text', 
        timestamp: serverTimestamp(), 
        readBy: [authUid] 
      }, 
      lastMessageAt: serverTimestamp() 
    });
    
    // Fetch chat data directly instead of relying on chatsData
    // (chatsData is null for admins in global state)
    getDoc(chatDocRef).then((chatSnap) => {
      if (!chatSnap.exists()) return;
      const chat = chatSnap.data();
      
      let recipients: string[] = [];
      
      if (chat.type === 'support') {
        if (currentUser.role === 'admin') {
          // Admin sent message → notify the client
          recipients = chat.clientId ? [chat.clientId] : [];
        } else {
          // Client sent message → notify all admins
          const adminUsers = usersData?.filter(u => u.role === 'admin') || [];
          recipients = adminUsers.map(u => u.id).filter(id => id !== authUid);
        }
      } else {
        // Direct chat → notify the other participant
        recipients = (chat.participants || []).filter((pId: string) => pId !== authUid);
      }
      
      if (recipients.length > 0) {
        addNotification(
          `New message from ${currentUser.name}`,
          `/support?chatId=${chatId}`,
          recipients,
          'chat',
          chatId
        );
      }
    }).catch(err => console.error('sendMessage: failed to fetch chat for notification', err));
  }, [currentUser, firestore, authUid, addNotification, usersData]);

  const createUser = useCallback(async (userData: { name: string; role: 'client' | 'team'; realEmail?: string; company?: string; }) => {
    if (!functions) return Promise.reject("Functions service not available.");
    const createUserFn = httpsCallable(functions, 'createUser');
    try {
      const result = await createUserFn(userData);
      return result.data;
    } catch (error: any) {
      toast({ title: "User Creation Failed", description: error.message, variant: "destructive" });
      throw error;
    }
  }, [functions, toast]);

  const deleteUser = useCallback(async (userId: string) => {
    if (!functions) return Promise.reject("Functions service not available.");
    const deleteUserFn = httpsCallable(functions, 'deleteUser');
    try {
      const result = await deleteUserFn({ userId });
      toast({ title: "Success", description: "User deleted successfully." });
      return result.data;
    } catch (error: any) {
      toast({ title: "User Deletion Failed", description: error.message, variant: "destructive" });
      throw error;
    }
  }, [functions, toast]);

  const addProject = async (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    if (!firestore || !currentUser || !authUid) return;
    const clientRef = doc(firestore, 'clients', projectData.client.id);
    try {
        await runTransaction(firestore, async (transaction) => {
            const clientDoc = await transaction.get(clientRef);
            if (!clientDoc.exists()) throw "Client document does not exist!";
            const clientData = clientDoc.data() as Client;
            if ((clientData.reelsCreated || 0) >= (clientData.reelsLimit || 0)) throw "Reel limit reached. Please upgrade.";
            const newProjectId = doc(collection(firestore, 'projects')).id;
            const newProject: Project = { id: newProjectId, ...projectData, coverImage: `project-${Math.ceil(Math.random() * 3)}` };
            transaction.set(doc(firestore, 'projects', newProjectId), newProject);
            transaction.update(clientRef, { reelsCreated: (clientData.reelsCreated || 0) + 1 });
            addNotification(`New project '${newProject.name}' created by ${currentUser.name}.`, `/projects/${newProject.id}`, [...(projectData.team_ids || []), ...users.filter(u => u.role === 'admin' && u.id !== authUid).map(a => a.id)], 'system');
            router.push(`/projects/${newProject.id}`);
        });
    } catch (e: any) {
        toast({ title: 'Project Creation Failed', description: typeof e === 'string' ? e : e.message, variant: 'destructive' });
    }
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks' | 'dueDate'>) => {
    if (!firestore || !projects || !usersData) return;
    const project = projects.find(p => p.id === taskData.projectId);
    if (!project) return;
    const assignedTo = usersData.find(u => project.team_ids.includes(u.id)) || usersData.find(u => u.role === 'admin');
    if (!assignedTo) return;
    const newTask: Omit<Task, 'id'> & { id: string } = { id: doc(collection(firestore, 'tasks')).id, ...taskData, assignedTo, status: 'Pending', remarks: [], dueDate: format(addWeeks(new Date(project.startDate), 1), 'yyyy-MM-dd') };
    setDocumentNonBlocking(doc(firestore, 'tasks', newTask.id), newTask, {});
    addNotification(`New task '${newTask.title}' added.`, `/projects/${project.id}`, [project.client.id, ...project.team_ids].filter(id => id !== authUid), 'system');

    // Trigger task notification email if client has a real email
    if (project.client?.realEmail && functions) {
      const sendEmailFn = httpsCallable(functions, 'sendTaskNotification');
      sendEmailFn({
        clientEmail: project.client.realEmail || project.client.email,
        clientName: project.client.name,
        projectName: project.name,
        taskName: taskData.title,
        taskDescription: taskData.description,
        dueDate: newTask.dueDate,
        projectUrl: `${window.location.origin}/projects/${project.id}`
      }).catch(err => console.error('Email task notification failed:', err));
    }
  }

  const deleteTask = (taskId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'tasks', taskId));
  }

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'projects', projectId), { team_ids: teamMemberIds });
    toast({ title: 'Team Updated' });
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus, remark: string) => {
    if (!currentUser || !firestore || !tasksData || !projectsData) return;
    const task = tasksData.find(t => t.id === taskId);
    if (!task) return;
    const project = projectsData.find(p => p.id === task.projectId);
    if (!project) return;
    const newRemark = { userId: authUid!, userName: currentUser.name, remark, timestamp: new Date().toISOString(), fromStatus: task.status, toStatus: status };
    updateDocumentNonBlocking(doc(firestore, 'tasks', taskId), { status, remarks: [...(task.remarks || []), newRemark] });
    addNotification(`Task '${task.title}' updated to '${status}'.`, `/projects/${project.id}`, [project.client.id, ...project.team_ids].filter(id => id !== authUid), 'system');
  }

  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'clients', clientId), clientData);
    
    // Also sync realEmail to users collection if updated
    if (clientData.realEmail) {
      updateDocumentNonBlocking(doc(firestore, 'users', clientId), { 
        realEmail: clientData.realEmail 
      });
    }
  }

  const selectPackage = async (packageData: Omit<ClientPackage, 'id' | 'startDate' | 'reelsUsed' | 'status' | 'clientId'>) => {
    if (!firestore || !currentUser || !authUid) return;
    const newPackage: ClientPackage = { id: uuidv4(), clientId: authUid, ...packageData, reelsUsed: 0, startDate: Timestamp.now(), status: 'active' };
    try {
      await runTransaction(firestore, async (transaction) => {
        const clientRef = doc(firestore, 'clients', authUid);
        const userRef = doc(firestore, 'users', authUid);
        transaction.update(clientRef, { currentPackage: newPackage, packageName: newPackage.packageName as PackageName, reelsLimit: newPackage.numberOfReels, maxDuration: newPackage.duration, reelsCreated: 0 });
        transaction.update(userRef, { packageName: newPackage.packageName as PackageName, reelsLimit: newPackage.numberOfReels });
      });
      toast({ title: "Package Activated" });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: 'destructive' });
    }
  };

  const updateTeamMember = (userId: string, memberData: Partial<User>) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), memberData);
  }

  const addScrumUpdate = (update: Omit<ScrumUpdate, 'id' | 'timestamp'>) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'scrum-updates'), { ...update, timestamp: new Date().toISOString() });
  }

  const addTimerSession = (session: Omit<TimerSession, 'id'>) => {
    if (!firestore) return;
    setDocumentNonBlocking(doc(collection(firestore, 'timer-sessions')), { ...session }, {});
  }

  const deleteProject = (projectId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'projects', projectId));
    router.push('/projects');
  };

  const updateProject = (projectId: string, projectData: Partial<Omit<Project, 'id' | 'client' | 'team_ids' | 'coverImage'>>) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'projects', projectId), projectData);
  };

  const addFile = (fileData: Omit<ProjectFile, 'id'>) => {
    if (!firestore) return;
    setDocumentNonBlocking(doc(collection(firestore, 'files')), { ...fileData, uploadedAt: Timestamp.now() }, {});
  }

  const updateFile = (fileId: string, fileData: Partial<ProjectFile>) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'files', fileId), fileData);
  }
  
  const deleteFile = (fileId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'files', fileId));
  };

  const addClientDocument = async (documentData: Omit<ClientDocument, 'id' | 'uploadedAt' | 'uploadedById' | 'url' | 'storagePath' | 'fileName'>, file: File) => {
    if (!firestore || !currentUser) return;
    const url = await uploadFile(file, `documents/${documentData.clientId}/${documentData.type}/${file.name}`);
    await addDoc(collection(firestore, 'clientDocuments'), { ...documentData, url, storagePath: `documents/${documentData.clientId}/${documentData.type}/${file.name}`, fileName: file.name, uploadedById: currentUser.id, uploadedAt: Timestamp.now() });
  };
  
  const deleteClientDocument = async (document: ClientDocument) => {
    if (!firestore) return;
    await deleteFileFromStorage(document.storagePath);
    await deleteDoc(doc(firestore, 'clientDocuments', document.id));
  };
  
  const markNotificationsAsRead = useCallback(async (type?: 'system' | 'chat') => {
    if (!firestore || !authUid || notificationsData.length === 0) return;
    const batch = writeBatch(firestore);
    notificationsData.filter(n => !(n.readBy || []).includes(authUid) && (!type || n.type === type)).forEach(n => {
      batch.update(doc(firestore, 'notifications', n.id), { readBy: arrayUnion(authUid) });
    });
    await batch.commit();
  }, [firestore, notificationsData, authUid]);

  const markChatNotificationsAsRead = useCallback(async (chatId: string) => {
    if (!firestore || !authUid) return;
    const q = query(collection(firestore, 'notifications'), where('chatId', '==', chatId), where('recipients', 'array-contains', authUid));
    const snap = await getDocs(q);
    const batch = writeBatch(firestore);
    snap.docs.forEach(d => batch.update(d.ref, { readBy: arrayUnion(authUid) }));
    await batch.commit();
  }, [firestore, authUid]);

  return (
    <DataContext.Provider value={{ 
        projects, tasks, clients, teamMembers, users, scrumUpdates, files, clientDocuments: clientDocuments || [], notifications: notificationsData, chats: chatsData || [], getOrCreateChat, sendMessage, timerSessions: timerSessions || [], clientPackages: clientPackages || [], addProject, addTask, deleteTask, updateProjectTeam, updateTaskStatus, createUser, deleteUser, updateClient, selectPackage, updateTeamMember, addScrumUpdate, addTimerSession, isLoading, deleteProject, updateProject, addFile, updateFile, deleteFile, addClientDocument, deleteClientDocument, addNotification, markNotificationsAsRead, markChatNotificationsAsRead,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
}
