import type { User, Client, Project, Task, ChatMessage, ProjectFile, ProjectStatus, TaskStatus, UserRole } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alex Johnson', email: 'admin@bookyourbrands.com', avatar: 'avatar-1', role: 'admin', username: 'admin', password: 'password' },
  { id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com', avatar: 'avatar-2', role: 'team', username: 'maria', password: 'password' },
  { id: 'user-3', name: 'James Smith', email: 'james@example.com', avatar: 'avatar-3', role: 'team', username: 'james', password: 'password' },
  { id: 'user-4', name: 'Creative Co.', email: 'client@creative.co', avatar: 'avatar-4', role: 'client', username: 'creative', password: 'password' },
  { id: 'user-5', name: 'Innovate Inc.', email: 'client@innovate.inc', avatar: 'avatar-5', role: 'client', username: 'innovate', password: 'password' },
  { id: 'user-6', name: 'Marketing Masters', email: 'client@marketing.com', avatar: 'avatar-6', role: 'client', username: 'marketing', password: 'password' },
];

export const clients: Client[] = [
    { id: 'client-1', name: 'Creative Co.', email: 'contact@creative.co', company: 'Creative Solutions LLC', avatar: 'avatar-4' },
    { id: 'client-2', name: 'Innovate Inc.', email: 'hello@innovate.inc', company: 'Innovate Technologies', avatar: 'avatar-5' },
    { id: 'client-3', name: 'Marketing Masters', email: 'info@marketing.com', company: 'Global Marketing Group', avatar: 'avatar-6' },
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
  { id: 'task-1', projectId: 'proj-1', title: 'Draft initial concepts', description: 'Brainstorm and draft 3-5 initial concepts for the campaign visuals.', assignedTo: users[1], status: 'Completed', dueDate: '2024-07-10' },
  { id: 'task-2', projectId: 'proj-1', title: 'Develop content calendar', description: 'Create a detailed content calendar for all social media platforms.', assignedTo: users[2], status: 'In Progress', dueDate: '2024-07-25' },
  { id: 'task-3', projectId: 'proj-1', title: 'Finalize ad copy', description: 'Write and finalize the copy for all paid ad placements.', assignedTo: users[2], status: 'Pending', dueDate: '2024-08-05' },
  { id: 'task-4', projectId: 'proj-2', title: 'Storyboard creation', description: 'Create a detailed storyboard for the promotional video.', assignedTo: users[1], status: 'Completed', dueDate: '2024-07-05' },
  { id: 'task-5', projectId: 'proj-2', title: 'Shoot raw footage', description: 'Client to provide all raw video footage for editing.', assignedTo: users[1], status: 'In Progress', dueDate: '2024-07-20' },
  { id: 'task-6', projectId: 'proj-3', title: 'Logo redesign sketches', description: 'Provide initial sketches for the new logo.', assignedTo: users[2], status: 'Completed', dueDate: '2024-05-15' },
];

export const chatMessages: { [key: string]: ChatMessage[] } = {
  'proj-1': [
    { id: 'msg-1', sender: clients[0] as unknown as User, message: "Hey team, any updates on the initial concepts?", timestamp: '2024-07-09T10:00:00Z' },
    { id: 'msg-2', sender: users[1], message: "Hi! Yes, just finished them up. I'll be uploading the draft for review shortly.", timestamp: '2024-07-09T10:05:00Z' },
    { id: 'msg-3', sender: users[0], message: "Great work, Maria. Looking forward to seeing them.", timestamp: '2024-07-09T10:06:00Z' },
  ],
  'proj-2': [
    { id: 'msg-4', sender: clients[1] as unknown as User, message: "We've uploaded the raw footage to the file manager. Let us know if you need anything else.", timestamp: '2024-07-18T14:30:00Z' },
    { id: 'msg-5', sender: users[1], message: "Received, thanks! I'll start the editing process tomorrow morning.", timestamp: '2024-07-18T14:35:00Z' },
  ]
};

export const projectFiles: { [key: string]: ProjectFile[] } = {
    'proj-1': [
        { id: 'file-1', name: 'brief.pdf', url: '#', uploadedBy: clients[0] as unknown as User, uploadedAt: '2024-07-01', size: '2.5MB', type: 'Reference' },
        { id: 'file-2', name: 'concept_draft_v1.zip', url: '#', uploadedBy: users[1], uploadedAt: '2024-07-09', size: '15.2MB', type: 'Deliverable' },
    ],
    'proj-2': [
        { id: 'file-3', name: 'raw_footage.mov', url: '#', uploadedBy: clients[1] as unknown as User, uploadedAt: '2024-07-18', size: '1.2GB', type: 'Raw' },
    ]
};
