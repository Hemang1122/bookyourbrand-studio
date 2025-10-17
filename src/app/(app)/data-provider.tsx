
'use client';

import { createContext, useContext, useState } from 'react';
import type { Project, Task, User, Client, ScrumUpdate } from '@/lib/types';
import { projects as initialProjects, tasks as initialTasks, users as initialUsers, clients as initialClients, scrumUpdates as initialScrumUpdates } from '@/lib/data';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';


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
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [scrumUpdates, setScrumUpdates] = useState<ScrumUpdate[]>(initialScrumUpdates);
  const [playNotification, setPlayNotification] = useState(false);
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();


  const teamMembers = users.filter(u => u.role === 'admin' || u.role === 'team');

  const addProject = (projectData: Omit<Project, 'id' | 'coverImage'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'assignedTo' | 'status'>) => {
    // Find the project to assign a team member from that project
    const project = projects.find(p => p.id === taskData.projectId);
    const assignedTo = project?.team[0] || initialProjects[0].team[0]; // Fallback

    const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        assignedTo: assignedTo,
        status: 'Pending',
    };
    setTasks(prev => [...prev, newTask]);
  }

  const updateProjectTeam = (projectId: string, teamMemberIds: string[]) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newTeam = users.filter(u => teamMemberIds.includes(u.id));
        return { ...p, team: newTeam };
      }
      return p;
    }));
  };

  const addClient = async (name: string, company: string, email: string, password: string) => {
    if (!auth || !firestore) return;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const totalUsers = users.length;
        const newUser: User = {
          id: firebaseUser.uid,
          name: name,
          email: email,
          avatar: `avatar-${(totalUsers % 6) + 1}`,
          role: 'client',
          username: name.toLowerCase().replace(/\s/g, ''),
        };
        const newClient: Client = {
          id: firebaseUser.uid, // Use firebase UID for client ID as well for consistency
          name: name,
          email: email,
          company: company,
          avatar: newUser.avatar,
        };
        
        // Now that the auth user is created and we have the UID, save the profile document.
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        await setDoc(userDocRef, newUser);
        
        // Update local state for immediate UI feedback
        setUsers(prev => [...prev, newUser]);
        setClients(prev => [...prev, newClient]);

    } catch (error: any) {
        console.error("Error creating client:", error);
        toast({ title: 'Error creating client', description: error.message, variant: 'destructive' });
    }
  }

  const addTeamMember = async (name: string, email: string, password: string) => {
     if (!auth || !firestore) return;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const totalUsers = users.length;
        const newMember: User = {
          id: firebaseUser.uid,
          name: name,
          email: email,
          avatar: `avatar-${(totalUsers % 6) + 1}`,
          role: 'team',
          username: name.toLowerCase().replace(/\s/g, ''),
        };
        
        // Now that the auth user is created and we have the UID, save the profile document.
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        await setDoc(userDocRef, newMember);
        
        // Update local state for immediate UI feedback
        setUsers(prev => [...prev, newMember]);

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
    // Add to the single source of truth
    initialScrumUpdates.unshift(newUpdate);
    // Update state from the single source of truth
    setScrumUpdates([...initialScrumUpdates]);
  };
  
  const triggerNotification = () => {
    setPlayNotification(true);
  };

  const notificationPlayed = () => {
    setPlayNotification(false);
  };


  return (
    <DataContext.Provider value={{ projects, tasks, clients, teamMembers, users, scrumUpdates, addProject, addTask, updateProjectTeam, addClient, addTeamMember, addScrumUpdate, triggerNotification, playNotification, notificationPlayed }}>
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
