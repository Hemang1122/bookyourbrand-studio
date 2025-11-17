import { FieldValue, Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'team' | 'client';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string; // Corresponds to id in placeholder-images.json
  role: UserRole;
  username: string;
  aadharUrl?: string;
  panUrl?: string;
  joiningLetterUrl?: string;
  fcmTokens?: string[];
};

export type PackageName = 'Bronze' | 'Silver' | 'Gold' | 'Advanced Editing' | 'Podcast';

export type Client = {
  id: string;
  name: string;
  email: string;
  company: string;
  avatar: string;
  founderDetails?: string;
  agreementUrl?: string;
  idCardUrl?: string;
  // Subscription details
  packageName?: PackageName;
  reelsLimit?: number;
  reelsCreated?: number;
  maxDuration?: number; // in seconds
};

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'In Progress' | 'Rework';

export type Project = {
  id: string;
  name: string;
  client: Client;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  team_ids: string[];
  description: string;
  guidelines?: string;
  coverImage: string;
};

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rework';

export type TaskRemark = {
  userId: string;
  userName: string;
  remark: string;
  timestamp: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: User;
  status: TaskStatus;
  dueDate: string;
  remarks: TaskRemark[];
};

export type MessageType = 'text' | 'file' | 'voice';

export type ChatMessage = {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  fileUrl?: string | null;
  messageType: MessageType;
  timestamp: Timestamp;
  replyTo?: {
    messageId: string;
    message: string;
    senderName: string;
  }
};

export type ProjectFile = {
  id: string;
  projectId: string;
  name:string;
  url: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedByAvatar: string;
  uploadedAt: Timestamp;
  size?: string;
  type?: string;
};

export type ReelUpdate = {
  reelName: string;
  duration: string;
  issues: string;
  remarks: string;
};


export type ScrumUpdate = {
  id: string;
  userId: string;
  yesterday: string;
  today: string;
  timestamp: string;
  reels?: ReelUpdate[];
};

// New types for file uploads
export type DocumentType = 'aadhar' | 'pan' | 'joiningLetter' | 'agreement' | 'idCard';

export type UserDocument = {
  userId: string;
  type: DocumentType;
  url: string;
  fileName: string;
  uploadedAt: FieldValue;
};

export type ClientDocument = {
  clientId: string;
  type: DocumentType;
  url: string;
  fileName: string;
  uploadedAt: FieldValue;
};

export type Notification = {
  id: string;
  projectId: string; // "general" for non-project specific
  message: string;
  timestamp: Timestamp;
  readBy: string[]; // Array of user IDs who have read it
  recipients: string[]; // Array of user IDs who should receive the notification
}

export interface TimerSession {
  id: string;
  name: string;
  startTime: number;
  endTime: number | null;
  date: string; // YYYY-MM-DD
}
