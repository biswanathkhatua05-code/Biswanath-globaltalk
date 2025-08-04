
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import { AlertTriangle, CheckCircle, Clock, Paperclip, Mic } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Timestamp, FieldValue } from 'firebase/firestore';


function formatDisplayTime(timestamp: Timestamp | FieldValue | number): string {
    if (timestamp instanceof FieldValue) {
      return 'Sending...';
    }
  
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
        // Fallback for any other unexpected type
      return 'Invalid date';
    }
  
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


export function MessageBubble({ message }: MessageBubbleProps) {
  const isSender = message.isSender;

  const renderStatusIcon = () => {
    if (message.status === 'sending') return <Clock size={12} className="text-muted-foreground" />;
    if (message.status === 'failed') return <AlertTriangle size={12} className="text-destructive" />;
    if (message.status === 'moderated') return <AlertTriangle size={12} className="text-yellow-500" />;
    if (message.status === 'sent' && isSender) return <CheckCircle size={12} className="text-primary" />;
    return null;
  };

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 py-2 px-1 my-1',
        isSender ? 'justify-end' : 'justify-start'
      )}
    >
      {!isSender && (
        <UserAvatar user={message.user} className="h-8 w-8 shrink-0 mt-1" />
      )}
      <div
        className={cn(
          'max-w-[70%] rounded-lg p-3 shadow-md transition-all duration-200 ease-in-out',
          isSender
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card text-card-foreground rounded-bl-none border'
        )}
      >
        {!isSender && message.user.name && (
          <p className="text-xs font-semibold mb-1 text-muted-foreground">{message.user.name}</p>
        )}

        {message.text && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>}
        
        {message.fileUrl && (
          <a 
            href={message.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2 text-xs p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <Paperclip size={14} />
            <span>{message.fileName || 'Attachment'}</span>
          </a>
        )}
        {message.voiceNoteUrl && (
           <div className="mt-2 flex items-center gap-2 text-xs p-2 rounded-md bg-black/5 dark:bg-white/5">
            <Mic size={14} />
            <span>{message.fileName || 'Voice Note'}</span>
            <audio controls src={message.voiceNoteUrl} className="h-8 w-full max-w-xs"></audio>
          </div>
        )}
        {message.status === 'moderated' && message.moderationReason && (
          <Badge variant="destructive" className="mt-1 text-xs">
            Moderated: {message.moderationReason}
          </Badge>
        )}
        <div className={cn("mt-1.5 flex items-center gap-1", isSender ? "justify-end" : "justify-start")}>
          <span className="text-xs opacity-70">
            {formatDisplayTime(message.timestamp)}
          </span>
          {isSender && renderStatusIcon()}
        </div>
      </div>
      {isSender && (
        <UserAvatar user={message.user} className="h-8 w-8 shrink-0 mt-1" />
      )}
    </div>
  );
}
