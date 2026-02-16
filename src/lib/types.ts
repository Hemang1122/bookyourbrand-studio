import { FieldValue, Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'team' | 'client';

export type User = {
  id: string;
  uid: string;
  name: string;
  email: string;
  avatar: string; // Corresponds to id in placeholder-images.json
  role: UserRole;
  username: string;
  aadharUrl?: string;
  panUrl?: string;
  joiningLetterUrl?: string;
  fcmTokens?: string[];
  isOnline?: boolean;
  lastSeen?: number | object;
  createdAt?: Timestamp;
  photoURL?: string;
};

export type PackageName = 'Bronze' | 'Silver' | 'Gold' | 'Advanced Editing' | 'Podcast';

export type SocialConnection = {
  connected: boolean;
  userId?: string;
  pageId?: string;
  pageName?: string;
  accessToken?: string;
  connectedAt?: Timestamp;
};

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
  social?: {
    instagram?: SocialConnection;
    facebook?: SocialConnection;
  };
  realEmail?: string;
};

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'In Progress' | 'Rework' | 'Approved';

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
  approvalToken?: string | null;
  approvedAt?: string;
  clientFeedback?: string;
  feedbackAt?: string;
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
  message: string;
  timestamp: Timestamp;
  readBy: string[]; // Array of user IDs who have read it
  recipients: string[]; // Array of user IDs who should receive the notification
  url: string; // The URL to navigate to when clicked
  type: 'system' | 'chat';
  chatId?: string;
}

export interface TimerSession {
  id: string;
  userId: string;
  name: string;
  startTime: number;
  endTime: number | null;
  date: string; // YYYY-MM-DD
}

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'file';

export type ChatLastMessage = {
  text: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  timestamp: Timestamp;
  readBy?: string[];
}

export type Chat = {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  createdBy: string;
  createdAt: Timestamp;
  groupName?: string | null;
  groupPhoto?: string | null;
  lastMessage?: ChatLastMessage | null;
  lastMessageAt: Timestamp;
  // This is a client-side only property
  unreadCount?: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  type: MessageType;
  text?: string | null;
  mediaURL?: string | null;
  mediaPath?: string | null;
  duration?: number | null;
  timestamp: Timestamp;
  readBy: string[];
  deleted?: boolean;
  edited?: boolean;
  editedAt?: Timestamp;
  reactions?: { [emoji: string]: string[] };
};

export type UserPresence = {
  isOnline: boolean;
  last_seen: number;
};
