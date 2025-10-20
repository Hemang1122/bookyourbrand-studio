
import type { User, Client, Project, Task } from './types';

// THIS FILE IS NOW FOR SEEDING DATA and providing fallback structure.
// The application primarily uses live data from Firestore.
// To re-seed, you would need a script to populate your Firestore database.

export const users: User[] = [
  { id: 'user-admin', name: 'Niddhi Sharma', email: 'niddhi@example.com', avatar: 'avatar-2', role: 'admin', username: 'niddhi' },
  { id: 'user-11', name: 'Himmat Singh', email: 'himmat@example.com', avatar: 'avatar-3', role: 'team', username: 'himmat' },
  // This user record corresponds to the client profile below. The ID should be the same.
  { id: 'client-5', name: 'VFA Global', email: 'vfa@creative.co', avatar: 'avatar-4', role: 'client', username: 'vfa' },
];

export const clients: Client[] = [
    // The ID here MUST match the ID of the corresponding 'client' role user in the users array.
    { id: 'client-5', name: 'VFA Global', email: 'vfa@creative.co', company: 'VFA Industries', avatar: 'avatar-4' },
];

export const projects: Project[] = [
];

export const tasks: Task[] = [
];
