
import { FieldValue } from 'firebase/firestore';

export type UserRole = 'admin' | 'team' | 'client';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string; // Corresponds to id in placeholder-images.json
  role: UserRole;
  username: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  company: string;
  avatar: string;
};

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'In Progress';

export type Project = {
  id: string;
  name: string;
  client: Client;
  status: ProjectStatus;
  deadline: string;
  team: User[];
  description: string;
  guidelines?: string;
  coverImage: string;
};

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: User;
  status: TaskStatus;
  dueDate: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: FieldValue | Date;
  fileUrl?: string;
  receiverId?: string; // For direct messages
};

export type ProjectFile = {
  id: string;
  name:string;
  url: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedByAvatar: string;
  uploadedAt: FieldValue | Date;
  size?: string;
  type?: string;
};

export type ScrumUpdate = {
  id: string;
  userId: string;
  yesterday: string;
  today: string;
  timestamp: string;
};
