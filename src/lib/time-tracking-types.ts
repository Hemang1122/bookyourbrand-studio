export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectName?: string;
  description: string;
  startTime: any;
  endTime?: any;
  duration: number; // in seconds
  status: 'running' | 'stopped';
  createdAt: any;
}

export interface TimeStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
}
