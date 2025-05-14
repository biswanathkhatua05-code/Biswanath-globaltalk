"use client";
import { ChatInterface } from '@/components/chat-interface';
import type { Message, User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { Loader2, UserCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PrivateChatPage() {
  const params = useParams();
  const chatId = params.chatId as string; // This would be the friend's UID or a session ID
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [friendUser, setFriendUser] = useState<User | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (chatId && userId) {
      setIsLoading(true);
      // Simulate fetching friend's details and past messages
      setTimeout(() => {
        const fetchedFriend: User = {
          id: chatId,
          name: `User ${chatId.substring(0, 5)}...`, // Shortened UID or fetched name
          avatarUrl: `https://placehold.co/100x100/78909C/FFFFFF?text=${chatId.charAt(0).toUpperCase()}`,
        };
        setFriendUser(fetchedFriend);

        // Simulate some initial messages
        setInitialMessages([
          {
            id: `msg_welcome_${Date.now()}`,
            text: `You are now chatting with ${fetchedFriend.name}.`,
            timestamp: Date.now() - 1000,
            user: { id: 'system', name: 'System' },
            isSender: false,
          },
          // Example message from the "friend"
          {
            id: `msg_friend_${Date.now()}`,
            text: `Hey there! Good to chat with you.`,
            timestamp: Date.now() - 500,
            user: fetchedFriend,
            isSender: false,
          }
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [chatId, userId]);

  if (isLoading || !userId || !friendUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {isLoading ? `Loading chat with ${chatId}...` : 'Preparing your chat...'}
        </p>
        <Link href="/chat/find" passHref className="mt-4">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Find Friends
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
      <ChatInterface
        chatId={chatId}
        chatMode="private"
        chatTitle={`Chat with ${friendUser.name}`}
        partner={friendUser}
        initialMessages={initialMessages}
        // onSendMessage would send to this specific user via backend
      />
    </div>
  );
}
