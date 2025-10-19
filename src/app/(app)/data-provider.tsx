
'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import type { Project, Task, User, Client, TaskStatus, ScrumUpdate, TaskRemark, Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';
import { useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp, where, query } from 'firebase/firestore';

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
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const firestore = useFirestore();

  // Firestore collections
  const projectsRef = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const tasksRef = useMemoFirebase(() => firestore ? collection(firestore, 'tasks') : null, [firestore]);
  const usersRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const clientsRef = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const scrumUpdatesRef = useMemoFirebase(() => firestore ? collection(firestore, 'scrumUpdates') : null, [firestore]);
  
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    // Note: This query requires a composite index on (userId, read).
    // The Firestore error message in the console will provide a direct link to create it.
    return query(collection(firestore, 'notifications'), where('userId', '==', currentUser.id));
  }, [firestore, currentUser]);


  // Data hooks
  const { data: projects, isLoading: loadingProjects } = useCollection<Project>(projectsRef);
  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksRef);
  const { data: users, isLoading: loadingUsers } = useCollection<User>(usersRef);
  const { data: clients, isLoading: loadingClients } = useCollection<Client>(clientsRef);
  const { data: scrumUpdates, isLoading: loadingScrums } = useCollection<ScrumUpdate>(scrumUpdatesRef);
  const { data: notifications, isLoading: loadingNotifs } = useCollection<Notification>(notificationsQuery);
  
  const [playNotification, setPlayNotification] = useState(false);

  const teamMembers = useMemo(() => users?.filter(u => u.role === 'admin' || u.role === 'team') || [], [users]);


  const addProject = (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    if (!projectsRef) return;
    const newProject = {
      ...projectData,
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(projectsRef, newProject);
    addNotification(`New project "${projectData.name}" was created.`, 'general');
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks'>) => {
    if (!tasksRef || !projects) return;

    const project = projects.find(p => p.id === taskData.projectId);
    const assignedTo = project?.team[0] || users?.find(u => u.role === 'team') || (users && users[0]);
    if (!assignedTo) {
        toast({title: "Error", description: "No one to assign task to."});
        return;
    }

    const newTask = {
        ...taskData,
        assignedTo: assignedTo,
        status: 'Pending' as TaskStatus,
        remarks: [],
        createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(tasksRef, newTask);
    addNotification(`New task "${newTask.title}" added to project "${project?.name}".`, newTask.projectId);
  }

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    if (!firestore || !users) return;
    const projectRef = doc(firestore, 'projects', projectId);
    const newTeam = users.filter(u => teamMemberIds.includes(u.id));
    updateDocumentNonBlocking(projectRef, { team: newTeam });
    const project = projects?.find(p => p.id === projectId);
    if(project) {
        addNotification(`The team for project "${project.name}" has been updated.`, projectId);
    }
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus, remark: string) => {
    if (!currentUser || !firestore || !tasks) return;

    const taskRef = doc(firestore, 'tasks', taskId);
    const currentTask = tasks.find(t => t.id === taskId);
    if(!currentTask) return;

    const newRemark: TaskRemark = {
      userId: currentUser.id,
      userName: currentUser.name,
      remark,
      timestamp: new Date().toISOString(),
      fromStatus: currentTask.status,
      toStatus: status,
    };
    
    const updatedRemarks = currentTask.remarks ? [...currentTask.remarks, newRemark] : [newRemark];
    updateDocumentNonBlocking(taskRef, { status, remarks: updatedRemarks });
    
    const project = projects?.find(p => p.id === currentTask.projectId);
    if(project) {
        addNotification(`Task "${currentTask.title}" in project "${project.name}" was updated to "${status}".`, currentTask.projectId);
    }
    
    toast({ title: 'Task Updated', description: `Task status changed to "${status}".` });
  }

  const addClient = (name: string, company: string, email: string) => {
    // This function should be tied to an admin action that creates a user in Firebase Auth
    // and then adds the corresponding document to Firestore.
    // For now, we'll just add to the collections non-blockingly.
    if (!clientsRef || !usersRef) return;
    
    // Create a new document in the 'clients' collection
    const newClientDocRef = doc(clientsRef); // Creates a ref with a new auto-generated ID
    const newClientData = {
        id: newClientDocRef.id,
        name,
        company,
        email,
        avatar: `avatar-${((users?.length || 0) % 6) + 1}`,
    };
    setDocumentNonBlocking(newClientDocRef, newClientData, { merge: false });

    // Also create a corresponding document in the 'users' collection
    const newUserDocRef = doc(usersRef, newClientDocRef.id); // Use the same ID
    const newUserData = {
        id: newUserDocRef.id,
        name,
        email,
        avatar: newClientData.avatar,
        role: 'client' as UserRole,
        username: name.toLowerCase().replace(/\s/g, ''),
    };
    setDocumentNonBlocking(newUserDocRef, newUserData, { merge: false });

    toast({title: "Client Added", description: `Client ${name} and their user account have been created.`});
  }

  const addTeamMember = (name: string, email: string) => {
     // This would also require creating a user in Firebase Auth.
     // For now, just adding to the 'users' collection.
    if (!usersRef) return;
    const newMember: Omit<User, 'id'> = {
        name,
        email,
        avatar: `avatar-${((users?.length || 0) % 6) + 1}`,
        role: 'team',
        username: name.toLowerCase().replace(/\s/g, ''),
     };
     addDocumentNonBlocking(usersRef, newMember);
     toast({title: "Team Member Added", description: `${name} has been added.`});
  }
  
  const triggerNotification = () => {
    setPlayNotification(true);
  };

  const notificationPlayed = () => {
    setPlayNotification(false);
  };

  const addScrumUpdate = (update: Omit<ScrumUpdate, 'id'>) => {
    if (!scrumUpdatesRef) return;
    const newUpdate: Omit<ScrumUpdate, 'id'> = { ...update, timestamp: new Date().toISOString() };
    addDocumentNonBlocking(scrumUpdatesRef, newUpdate);
  };

  const addNotification = (message: string, projectId: string) => {
    if (!currentUser || !firestore) return;
    const notificationsColRef = collection(firestore, 'notifications');
    const notification: Omit<Notification, 'id'> & {read: boolean, userId: string} = {
      message: `${currentUser.name} ${message}`,
      timestamp: new Date().toISOString(),
      projectId: projectId,
      userId: currentUser.id,
      read: false,
    };
    addDocumentNonBlocking(notificationsColRef, notification);
    triggerNotification();
  };

  const markNotificationsAsRead = (projectId?: string) => {
    if (!firestore || !notifications) return;
    notifications.forEach(n => {
        if (!n.read && (!projectId || n.projectId === projectId)) {
            const notifRef = doc(firestore, 'notifications', n.id);
            updateDocumentNonBlocking(notifRef, { read: true });
        }
    });
  };

  const isLoading = loadingProjects || loadingTasks || loadingUsers || loadingClients || loadingScrums || loadingNotifs;

  return (
    <DataContext.Provider value={{ 
        projects: projects || [], 
        tasks: tasks || [], 
        clients: clients || [], 
        teamMembers: teamMembers, 
        users: users || [], 
        scrumUpdates: scrumUpdates || [],
        notifications: notifications || [],
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
        isLoading
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
