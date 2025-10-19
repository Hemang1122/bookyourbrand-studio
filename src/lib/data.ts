import type { User, Client, Project, Task, ChatMessage, ProjectFile } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alex Johnson', email: 'admin@bookyourbrands.com', avatar: 'avatar-1', role: 'admin', username: 'admin' },
  { id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com', avatar: 'avatar-2', role: 'team', username: 'maria' },
  { id: 'user-3', name: 'James Smith', email: 'james@example.com', avatar: 'avatar-3', role: 'team', username: 'james' },
  { id: 'user-7', name: 'Krish', email: 'krish@example.com', avatar: 'avatar-1', role: 'team', username: 'krish' },
  { id: 'user-8', name: 'Hemang', email: 'hemang@example.com', avatar: 'avatar-2', role: 'team', username: 'hemang' },
  { id: 'user-4', name: 'Creative Co.', email: 'client@creative.co', avatar: 'avatar-4', role: 'client', username: 'creative' },
  { id: 'user-5', name: 'Innovate Inc.', email: 'client@innovate.inc', avatar: 'avatar-5', role: 'client', username: 'innovate' },
  { id: 'user-6', name: 'Marketing Masters', email: 'client@marketing.com', avatar: 'avatar-6', role: 'client', username: 'marketing' },
  { id: 'user-9', name: 'Kumud', email: 'kumud@creative.co', avatar: 'avatar-3', role: 'client', username: 'kumud' },
];

export const clients: Client[] = [
    { id: 'client-1', name: 'Creative Co.', email: 'contact@creative.co', company: 'Creative Solutions LLC', avatar: 'avatar-4' },
    { id: 'client-2', name: 'Innovate Inc.', email: 'hello@innovate.inc', company: 'Innovate Technologies', avatar: 'avatar-5' },
    { id: 'client-3', name: 'Marketing Masters', email: 'info@marketing.com', company: 'Global Marketing Group', avatar: 'avatar-6' },
    { id: 'client-4', name: 'Kumud', email: 'kumud@creative.co', company: 'Creative Solutions LLC', avatar: 'avatar-3' },
];

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Q3 Social Media Campaign',
    client: clients[0],
    status: 'Active',
    deadline: '2024-09-30',
    team: [users[1], users[2]],
    description: 'A comprehensive social media campaign for the third quarter, focusing on brand awareness and engagement.',
    coverImage: 'project-1'
  },
  {
    id: 'proj-2',
    name: 'New Website Launch Video',
    client: clients[1],
    status: 'In Progress',
    deadline: '2024-08-15',
    team: [users[1]],
    description: 'Promotional video for the launch of the new corporate website. High-energy and visually appealing.',
    coverImage: 'project-2'
  },
  {
    id: 'proj-3',
    name: 'Brand Guideline Refresh',
    client: clients[0],
    status: 'Completed',
    deadline: '2024-06-01',
    team: [users[2]],
    description: 'Complete overhaul of the existing brand guidelines to modernize the brand image.',
    coverImage: 'project-3'
  },
    {
    id: 'proj-4',
    name: 'Annual Report Animation',
    client: clients[2],
    status: 'On Hold',
    deadline: '2024-11-20',
    team: [users[1], users[2]],
    description: 'Animated video summarizing the key findings of the annual report for shareholders.',
    coverImage: 'project-1'
  },
];

export const tasks: Task[] = [
  { id: 'task-1', projectId: 'proj-1', title: 'Draft initial concepts', description: 'Brainstorm and draft 3-5 initial concepts for the campaign visuals.', assignedTo: users[1], status: 'Completed', dueDate: '2024-07-10', remarks: [] },
  { id: 'task-2', projectId: 'proj-1', title: 'Develop content calendar', description: 'Create a detailed content calendar for all social media platforms.', assignedTo: users[2], status: 'In Progress', dueDate: '2024-07-25', remarks: [] },
  { id: 'task-3', projectId: 'proj-1', title: 'Finalize ad copy', description: 'Write and finalize the copy for all paid ad placements.', assignedTo: users[2], status: 'Pending', dueDate: '2024-08-05', remarks: [] },
  { id: 'task-4', projectId: 'proj-2', title: 'Storyboard creation', description: 'Create a detailed storyboard for the promotional video.', assignedTo: users[1], status: 'Completed', dueDate: '2024-07-05', remarks: [] },
  { id: 'task-5', projectId: 'proj-2', title: 'Shoot raw footage', description: 'Client to provide all raw video footage for editing.', assignedTo: users[1], status: 'In Progress', dueDate: '2024-07-20', remarks: [] },
  { id: 'task-6', projectId: 'proj-3', title: 'Logo redesign sketches', description: 'Provide initial sketches for the new logo.', assignedTo: users[2], status: 'Completed', dueDate: '2024-05-15', remarks: [] },
];

// This mock data is no longer the source of truth for chat and files.
// It is kept here for reference but the app now uses Firestore.
export const chatMessages: { [key: string]: any[] } = {
  'proj-1': [],
  'proj-2': []
};

export const projectFiles: { [key