
"use client";
import { ChatInterface } from '@/components/chat-interface';
import type { User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { Loader2, UserCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export default function PrivateChatPage() {
  const params = useParams();
  const friendUid = params.chatId as string; 
  const { userId, firebaseUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [friendUser, setFriendUser] = useState<User | null>(null);
  
  // Determine the chat room ID consistently
  const chatRoomId = useMemo(() => {
    if (!userId || !friendUid) return null;
    // Create a consistent ID by sorting UIDs
    return [userId, friendUid].sort().join('_');
  }, [userId, friendUid]);

  useEffect(() => {
    if (friendUid && userId) {
      setIsLoading(true);
      // Simulate fetching friend's details. In a real app, you'd fetch this from a 'users' collection.
      // For now, we'll just create a placeholder.
      // If you have a users collection, you would do:
      // const fetchFriendData = async () => {
      //   const userDoc = await getDoc(doc(firestore, 'users', friendUid));
      //   if (userDoc.exists()) {
      //     setFriendUser({ id: userDoc.id, ...userDoc.data() } as User);
      //   } else {
      //     // Handle user not found
      //     setFriendUser({ id: friendUid, name: `User ${friendUid.substring(0, 5)}...`});
      //   }
      //   setIsLoading(false);
      // };
      // fetchFriendData();

      // Placeholder friend data:
      const fetchedFriend: User = {
        id: friendUid,
        name: `User ${friendUid.substring(0, 5)}...`, 
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
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
      <ChatInterface
        chatId={chatRoomId} // Use the consistent chatRoomId
        chatMode="private"
        chatTitle={`Chat with ${friendUser.name}`}
        partner={friendUser}
      />
    </div>
  );
}
