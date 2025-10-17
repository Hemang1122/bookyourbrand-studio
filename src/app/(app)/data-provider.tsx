
'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import type { Project, Task, User, Client, ScrumUpdate } from '@/lib/types';
import { projects as initialProjects, tasks as initialTasks, scrumUpdates as initialScrumUpdates } from '@/lib/data';
import { useFirebase, useCollection } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, collection, query, where } from 'firebase/firestore';


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
  addClient: (name: string, company: string, email: string, password: string) => void;
  addTeamMember: (name: string, email: string, password: string) => void;
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
  const [scrumUpdates, setScrumUpdates] = useState<ScrumUpdate[]>(initialScrumUpdates);
  const [playNotification, setPlayNotification] = useState(false);

  const { auth, firestore } = useFirebase();
  const { toast } = useToast();

  // Make Firestore the single source of truth for users.
  const usersCollectionRef = useMemo(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersCollectionRef);

  // Derive clients and team members from the live user data.
  const clients = useMemo(() => (users || []).filter((u): u is User & Client => u.role === 'client').map(u => ({...u, company: u.company || '' })), [users]);
  const teamMembers = useMemo(() => (users || []).filter(u => u.role === 'admin' || u.role === 'team'), [users]);


  const addProject = (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    if (!users) return;
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status'>) => {
    if (!users) return;
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
    if (!users) return;
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newTeam = users.filter(u => teamMemberIds.includes(u.id));
        return { ...p, team: newTeam };
      }
      return p;
    }));
  };

  const addClient = async (name: string, company: string, email: string, password: string) => {
    if (!auth || !firestore || !users) return;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const newUser: User & Partial<Client> = {
          id: firebaseUser.uid,
          name: name,
          email: email,
          avatar: `avatar-${(users.length % 6) + 1}`,
          role: 'client',
          username: name.toLowerCase().replace(/\s/g, ''),
          company: company
        };
        
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        // This is now the single point of writing. `useCollection` will update the state.
        await setDoc(userDocRef, newUser);
        toast({ title: 'Client Added', description: `A login has been created for ${name}.` });

    } catch (error: any) {
        console.error("Error creating client:", error);
        toast({ title: 'Error creating client', description: error.message, variant: 'destructive' });
    }
  }

  const addTeamMember = async (name: string, email: string, password: string) => {
     if (!auth || !firestore || !users) return;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const newMember: User = {
          id: firebaseUser.uid,
          name: name,
          email: email,
          avatar: `avatar-${(users.length % 6) + 1}`,
          role: 'team',
          username: name.toLowerCase().replace(/\s/g, ''),
        };
        
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        // This is now the single point of writing. `useCollection` will update the state.
        await setDoc(userDocRef, newMember);
        toast({ title: 'Team Member Added', description: `${name} can now log in.` });

    } catch (error: any) {
         console.error("Error creating team member:", error);
         toast({ title: 'Error creating team member', description: error.message, variant: 'destructive' });
    }
  }

  const addScrumUpdate = (updateData: Omit<ScrumUpdate, 'id'>) => {
    const newUpdate: ScrumUpdate = {
      ...updateData,
      id: `scrum-${Date.now()}`,
    };
    initialScrumUpdates.unshift(newUpdate);
    setScrumUpdates([...initialScrumUpdates]);
  };
  
  const triggerNotification = () => {
    setPlayNotification(true);
  };

  const notificationPlayed = () => {
    setPlayNotification(false);
  };


  return (
    <DataContext.Provider value={{ 
        projects, 
        tasks, 
        clients: clients || [], 
        teamMembers: teamMembers || [], 
        users: users || [], 
        scrumUpdates, 
        addProject, 
        addTask, 
        updateProjectTeam, 
        addClient, 
        addTeamMember, 
        addScrumUpdate, 
        triggerNotification, 
        playNotification, 
        notificationPlayed,
        isLoading: usersLoading 
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
