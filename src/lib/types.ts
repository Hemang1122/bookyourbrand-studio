
import { FieldValue, Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'team' | 'client';

export type User = {
  id: string;
  uid: string;
  name: string;
  email: string;
  realEmail?: string;
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
  packageName?: PackageName;
  reelsLimit?: number;
};

export type PackageName = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Advanced Editing' | 'Podcast' | 'Custom';

export interface Package {
  id: string;
  name: PackageName;
  icon?: string;
  reelOptions: number[]; // [10, 15, 30]
  durationOptions: number[]; // [30, 45, 60, 90] in seconds
  prices: {
    [reels: number]: {
      [duration: number]: number;
    };
  };
  features?: string[];
  customPricing?: boolean;
}

export interface ClientPackage {
  id: string;
  clientId: string;
  packageName: string;
  numberOfReels: number;
  duration: number;
  price: number;
  reelsUsed: number;
  startDate: Date | any;
  expiryDate?: Date | any;
  status: 'active' | 'expired' | 'cancelled';
  customDetails?: string;
  includeAIVoice?: boolean;
  includeStockFootage?: boolean;
  createdBy?: string;
  createdAt?: any;
}

export type SocialConnection = {
  connected: boolean;
  userId?: string;
  pageId?: string;
  pageName?: string;
  accessToken?: string;
  connectedAt?: Timestamp;
};

export type ClientDocumentType = 'contract' | 'package_details' | 'business_registration' | 'founder_details' | 'custom';

export type ClientDocument = {
  id: string;
  clientId: string;
  name: string; 
  type: ClientDocumentType;
  fileName: string;
  url: string;
  storagePath: string; 
  uploadedById: string;
  uploadedAt: Timestamp;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  company: string;
  avatar: string;
  packageName?: PackageName;
  reelsLimit?: number;
  reelsCreated?: number;
  maxDuration?: number; // in seconds
  social?: {
    instagram?: SocialConnection;
    facebook?: SocialConnection;
  };
  realEmail?: string;
  currentPackage?: ClientPackage;
  packageHistory?: ClientPackage[];
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

export type AssetCategory = 'raw' | 'deliverable';

export type ProjectFolder = {
  id: string;
  projectId: string;
  name: string;
  createdAt: Timestamp;
};

export type ProjectFile = {
  id: string;
  projectId: string;
  folderId?: string | null;
  category?: AssetCategory;
  name:string;
  description?: string;
  url: string;
  nasPath?: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedByAvatar: string;
  uploadedAt: Timestamp;
  size?: string;
  type?: string;
  fileType?: string;
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
  type: 'direct' | 'group' | 'support';
  participants: string[];
  createdBy: string;
  createdAt: Timestamp;
  groupName?: string | null;
  groupPhoto?: string | null;
  lastMessage?: ChatLastMessage | null;
  lastMessageAt: Timestamp;
  // This is a client-side only property
  unreadCount?: number;
  clientId?: string;
  clientName?: string;
  clientAvatar?: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  type: MessageType;
  text?: string | null;
  mediaURL?: string | null;
  mediaPath?: string | null;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number | null;
  timestamp: Timestamp;
  readBy: string[];
  deleted?: boolean;
  edited?: boolean;
  editedAt?: Timestamp;
  reactions?: { [emoji: string]: string[] };
  replyTo?: {
    messageId: string;
    text: string;
    senderId: string;
    senderName: string;
  };
  pinned?: boolean;
};

export type UserPresence = {
  isOnline: boolean;
  last_seen: number;
};
