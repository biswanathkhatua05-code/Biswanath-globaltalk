
"use client";
// import type { Message, User } from '@/lib/types'; // Message and User types are used by ChatInterface
import { useAuth } from '@/context/auth-context';
import { Loader2, Users } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/chat-interface';

// Sample users and initial messages are removed as data will come from Firestore via ChatInterface

export default function GlobalChatPage() {
  const { userId, isLoggedIn } = useAuth();

  if (!isLoggedIn || !userId) {
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
          chatId="global_chat_room" // This will be used by ChatInterface to determine the Firestore collection
          chatMode="global"
          chatTitle="" // Title handled by Card above
        />
      </div>
    </div>
  );
}
