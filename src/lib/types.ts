import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  name?: string;
  avatarUrl?: string; // URL to placeholder or actual avatar
}

export interface Message {
  id: string; // Firestore document ID
  text: string;
  timestamp: Timestamp | number; // Firestore Timestamp or client-side number before conversion
  user: User; // Simplified user object, consider storing only userId in Firestore and denormalizing if needed
  userId: string; // Store userId directly for easier querying
  isSender: boolean; // True if the current user sent this message (client-side only)
  status?: 'sending' | 'sent' | 'failed' | 'moderated'; // Optional message status
  moderationReason?: string; // If moderated
  fileUrl?: string;
  fileName?: string;
  voiceNoteUrl?: string;
}

export type ChatMode = 'random' | 'global' | 'private';
