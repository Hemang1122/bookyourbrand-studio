export type UserRole = 'admin' | 'team' | 'client';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string; // Corresponds to id in placeholder-images.json
  role: UserRole;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  company: string;
  avatar: string;
};

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed';

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
  sender: User;
  message: string;
  timestamp: string;
  fileUrl?: string;
};

export type ProjectFile = {
  id: string;
  name: string;
  url: string;
  uploadedBy: User;
  uploadedAt: string;
  size: string;
  type: 'Reference' | 'Deliverable' | 'Raw';
};
