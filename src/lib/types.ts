export interface User {
  id: string;
  name?: string;
  avatarUrl?: string; // URL to placeholder or actual avatar
}

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  user: User;
  isSender: boolean; // True if the current user sent this message
  status?: 'sending' | 'sent' | 'failed' | 'moderated'; // Optional message status
  moderationReason?: string; // If moderated
  fileUrl?: string;
  fileName?: string;
  voiceNoteUrl?: string;
}

export type ChatMode = 'random' | 'global' | 'private';
