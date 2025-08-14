
import type { Timestamp, FieldValue } from 'firebase/firestore';

export interface User {
  id: string; // UID
  name?: string;
  avatarUrl?: string; // URL to placeholder or actual avatar
  isCreator?: boolean;
}

export interface Video {
    id: string; // Firestore document ID
    title: string;
    description: string;
    videoUrl: string; // URL to the video file
    thumbnailUrl: string;
    creatorId: string;
    creatorName: string;
    creatorAvatarUrl: string;
    views: number;
    likes: number;
    createdAt: Timestamp | FieldValue;
}

export interface Comment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string;
    createdAt: Timestamp | FieldValue;
}


export interface Message {
  id: string; // Firestore document ID
  text: string;
  timestamp: Timestamp | FieldValue;
  author: User; // User object of the message author
  userId: string; // Store userId directly for easier querying
  isSender: boolean; // True if the current user sent this message (client-side only)
  status?: 'sending' | 'sent' | 'failed' | 'moderated'; // Optional message status
  moderationReason?: string; // If moderated
  fileUrl?: string;
  fileName?: string;
  voiceNoteUrl?: string;
}

export type ChatMode = 'random' | 'global' | 'private';
