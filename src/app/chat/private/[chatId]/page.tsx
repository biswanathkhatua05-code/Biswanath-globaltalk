
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export default function PrivateChatPage() {
  const params = useParams();
  const router = useRouter();
  const friendUid = params.chatId as string; 
  const { userId, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [friendUser, setFriendUser] = useState<User | null>(null);
  
  const chatRoomId = useMemo(() => {
    if (!userId || !friendUid) return null;
    // Sort UIDs to create a consistent and predictable chat room ID
    return [userId, friendUid].sort().join('_');
  }, [userId, friendUid]);

  useEffect(() => {
    const setupChat = async () => {
      if (friendUid && userId && userProfile && chatRoomId) {
        setIsLoading(true);
        
        try {
          // Fetch friend's details from the 'users' collection
          const friendRef = doc(firestore, 'users', friendUid);
          const friendSnap = await getDoc(friendRef);

          if (friendSnap.exists()) {
             setFriendUser({ id: friendSnap.id, ...friendSnap.data() } as User);
          } else {
            // If for some reason the friend's profile doesn't exist, create a placeholder
            const placeholderFriend: User = {
              id: friendUid,
              name: `User ${friendUid.substring(0, 6)}...`, 
              avatarUrl: `https://api.dicebear.com/8.x/lorelei/svg?seed=${friendUid}`,
            };
            setFriendUser(placeholderFriend);
          }

          // Ensure the chat session document exists so security rules pass on message reads
          const chatSessionRef = doc(firestore, 'chat_sessions', chatRoomId);
          const chatSessionSnap = await getDoc(chatSessionRef);

          if (!chatSessionSnap.exists()) {
            await setDoc(chatSessionRef, {
              participants: [userId, friendUid],
              createdAt: new Date(),
            });
          }

        } catch (error) {
            console.error("Error setting up private chat:", error);
            // Handle error, maybe show a toast
        } finally {
            setIsLoading(false);
        }
      }
    };
    
    setupChat();
  }, [friendUid, userId, userProfile, chatRoomId]);

  if (isLoading || !userId || !friendUser || !chatRoomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {`Loading chat with ${friendUid}...`}
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
