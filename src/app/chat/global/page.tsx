"use client";
import { ChatInterface } from '@/components/chat-interface';
import type { Message, User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { Loader2, Users } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Sample users for global chat simulation
const sampleUsers: User[] = [
  { id: 'user_global_1', name: 'GlobalUser123', avatarUrl: 'https://placehold.co/100x100/FFC107/000000?text=G1' },
  { id: 'user_global_2', name: 'ChattyCathie', avatarUrl: 'https://placehold.co/100x100/4CAF50/FFFFFF?text=CC' },
  { id: 'user_global_3', name: 'SilentBob', avatarUrl: 'https://placehold.co/100x100/2196F3/FFFFFF?text=SB' },
];

const initialGlobalMessages: Message[] = [
  {
    id: 'global_msg_1',
    text: 'Welcome to the Global Chat! Feel free to share your thoughts.',
    timestamp: Date.now() - 100000,
    user: { id: 'system', name: 'GlobaTalk Bot', avatarUrl: 'https://placehold.co/100x100/008080/FFFFFF?text=B' },
    isSender: false,
  },
  {
    id: 'global_msg_2',
    text: 'Hello everyone! What a beautiful day!',
    timestamp: Date.now() - 50000,
    user: sampleUsers[0],
    isSender: false,
  }
];


export default function GlobalChatPage() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialGlobalMessages);

  // Simulate new messages appearing in global chat
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      const newMessage: Message = {
        id: `global_msg_${Date.now()}`,
        text: `This is a simulated global message from ${randomUser.name}! Random number: ${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        user: randomUser,
        isSender: randomUser.id === userId, // This will usually be false for simulated messages
      };
      setMessages(prevMessages => [...prevMessages, newMessage].slice(-50)); // Keep last 50 messages
    }, 20000); // New message every 20 seconds

    return () => clearInterval(interval);
  }, [userId]);


  if (!userId) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading session...</span></div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      <Card className="mb-4 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Global Message Box</CardTitle>
              <CardDescription>See messages from users all around the world. All messages are public.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      <div className="flex-grow min-h-0"> {/*This ensures ChatInterface can take remaining height*/}
         <ChatInterface
          chatId="global_chat_room"
          chatMode="global"
          chatTitle="" // Title handled by Card above
          initialMessages={messages}
          // In a real app, onSendMessage would post to a global Firestore collection
        />
      </div>
    </div>
  );
}
