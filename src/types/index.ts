import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
}

export interface TranscriptPart {
  speaker: string;
  text: string;
  timestamp: number;
}

export interface MeetingInsights {
  customerFeedback: string;
  decisions: string[];
  actionItems: string[];
}

export interface Meeting {
  id: string;
  title: string;
  date: Timestamp;
  duration: number;
  transcript: TranscriptPart[];
  summary: string;
  insights: MeetingInsights;
  createdBy: string;
  status: 'recording' | 'analyzing' | 'completed';
}

export interface ActionItem {
  id: string;
  meetingId: string;
  task: string;
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdBy: string;
}
