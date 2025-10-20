
import type { User, Client, Project, Task } from './types';

// THIS FILE IS NOW FOR SEEDING DATA and providing fallback structure.
// The application primarily uses live data from Firestore.
// To re-seed, you would need a script to populate your Firestore database.

export const users: User[] = [
  { id: 'user-10', name: 'Niddhi Sharma', email: 'niddhi@bookyourbrands.com', avatar: 'avatar-2', role: 'admin', username: 'niddhi' },
  { id: 'user-11', name: 'Himmat Singh', email: 'himmat@example.com', avatar: 'avatar-3', role: 'team', username: 'himmat' },
  // Ensure the client user record has a distinct ID, but we'll match via email.
  { id: 'client-user-vfa', name: 'VFA Global', email: 'vfa@creative.co', avatar: 'avatar-4', role: 'client', username: 'vfa' },
];

export const clients: Client[] = [
    { id: 'client-5', name: 'VFA Global', email: 'vfa@creative.co', company: 'VFA Industries', avatar: 'avatar-4' },
];

export const projects: Project[] = [
];

export const tasks: Task[] = [
];
