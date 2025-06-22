
"use client";
import { ChatInterface } from '@/components/chat-interface';
import type { User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { Loader2, UserCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function PrivateChatPage() {
  const params = useParams();
  const router = useRouter();
  const friendUid = params.chatId as string; 
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [friendUser, setFriendUser] = useState<User | null>(null);
  
  const chatRoomId = useMemo(() => {
    if (!userId || !friendUid) return null;
    return [userId, friendUid].sort().join('_');
  }, [userId, friendUid]);

  useEffect(() => {
    if (friendUid && userId) {
      setIsLoading(true);
      // In a real app, you'd fetch friend's details from a 'users' collection.
      // For this demo, we create placeholder data.
      const fetchedFriend: User = {
        id: friendUid,
        name: `User ${friendUid.substring(0, 6)}...`, 
        avatarUrl: `https://placehold.co/100x100/78909C/FFFFFF?text=${friendUid.charAt(0).toUpperCase()}`,
      };
      setFriendUser(fetchedFriend);
      setIsLoading(false);
    }
  }, [friendUid, userId]);

  if (isLoading || !userId || !friendUser || !chatRoomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {isLoading ? `Loading chat with ${friendUid}...` : 'Preparing your chat...'}
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
    <div className="flex flex-col h-full">
        <header className="flex items-center gap-4 p-4 border-b bg-card">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
                <UserAvatar user={friendUser} className="h-10 w-10" />
                <div>
                    <h2 className="text-lg font-semibold">{friendUser.name}</h2>
                    <p className="text-xs text-muted-foreground">Private Chat</p>
                </div>
            </div>
        </header>
        <div className="flex-grow min-h-0">
             <ChatInterface
                chatId={chatRoomId}
                chatMode="private"
                chatTitle="" // Title is now handled in the header above
                partner={friendUser}
             />
        </div>
    </div>
  );
}
