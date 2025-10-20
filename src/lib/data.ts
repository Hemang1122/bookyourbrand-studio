
import type { User, Client, Project, Task } from './types';

// THIS FILE IS NOW FOR SEEDING DATA and providing fallback structure.
// The application primarily uses live data from Firestore.
// To re-seed, you would need a script to populate your Firestore database.

export const users: User[] = [
  { id: 'user-admin', name: 'Niddhi Sharma', email: 'niddhi@example.com', avatar: 'avatar-2', role: 'admin', username: 'niddhi' },
  { id: 'user-11', name: 'Himmat Singh', email: 'himmat@example.com', avatar: 'avatar-3', role: 'team', username: 'himmat' },
];

export const clients: Client[] = [
];

export const projects: Project[] = [
];

export const tasks: Task[] = [
];
