
"use client";
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/chat-interface';
import type { User } from '@/lib/types'; // Message type is handled by ChatInterface
import { Loader2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, limit, orderBy, onSnapshot, Timestamp, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


const CHAT_SESSIONS_COLLECTION = 'random_chat_sessions_pool';

export default function RandomChatPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const { userId, firebaseUser } = useAuth();
  const { toast } = useToast();

  const currentUser: User | undefined = firebaseUser ? { 
    id: firebaseUser.uid, 
    name: firebaseUser.displayName || `Stranger ${firebaseUser.uid.substring(0,4)}`,
    avatarUrl: firebaseUser.photoURL || `https://placehold.co/100x100/E0E0E0/757575?text=${(firebaseUser.displayName || 'S').charAt(0).toUpperCase()}`
  } : undefined;


  const findPartner = useCallback(async () => {
    if (!currentUser) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setPartner(null);
    setChatSessionId(null);

    try {
      const sessionsRef = collection(firestore, CHAT_SESSIONS_COLLECTION);
      
      // Simplified query to avoid needing a composite index. We filter for the user client-side.
      const q = query(
        sessionsRef, 
        where("status", "==", "waiting"), 
        limit(10) // Fetch up to 10 waiting sessions
      );
      
      const querySnapshot = await getDocs(q);

      // Find the first session that is not started by the current user
      const sessionDoc = querySnapshot.docs.find(doc => doc.data().userId1 !== currentUser.id);

      if (sessionDoc) {
        // Found a waiting partner
        const sessionData = sessionDoc.data() as DocumentData;

        const newPartnerUser = sessionData.user1 as User;

        await updateDoc(doc(firestore, CHAT_SESSIONS_COLLECTION, sessionDoc.id), {
          userId2: currentUser.id,
          user2: currentUser,
          status: "active",
          updatedAt: serverTimestamp(),
        });
        
        setPartner(newPartnerUser);
        setChatSessionId(sessionDoc.id); // This ID will be used for messages subcollection
        toast({ title: "Partner Found!", description: `You are now chatting with ${newPartnerUser.name}.` });
        
      } else {
        // No suitable waiting partner found, create a new session and wait
        const newSessionRef = await addDoc(sessionsRef, {
          userId1: currentUser.id,
          user1: currentUser,
          status: "waiting",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setChatSessionId(newSessionRef.id);
        // User will wait. Listen for another user to join this session.
        toast({ title: "Searching...", description: "Waiting for a partner to connect. This may take a moment."});

        const unsub = onSnapshot(doc(firestore, CHAT_SESSIONS_COLLECTION, newSessionRef.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === "active" && data.user2) {
                    setPartner(data.user2 as User);
                    toast({ title: "Partner Connected!", description: `You are now chatting with ${data.user2.name}.` });
                    unsub(); // Stop listening once partner is found
                }
            }
        });
      }
    } catch (error) {
      console.error("Error finding partner:", error);
      toast({ title: "Search Failed", description: "Could not find a partner. Please try again.", variant: "destructive"});
    } finally {
      setIsSearching(false);
    }
  }, [currentUser, toast]);

  const handleDisconnect = useCallback(async () => {
    if (chatSessionId) {
      try {
        // Update session status to 'disconnected' or delete it
        await updateDoc(doc(firestore, CHAT_SESSIONS_COLLECTION, chatSessionId), {
          status: "disconnected",
          disconnectedAt: serverTimestamp(),
        });
        // Or, if you prefer to delete: await deleteDoc(doc(firestore, CHAT_SESSIONS_COLLECTION, chatSessionId));
        toast({title: "Disconnected", description: "You have left the chat."})
      } catch (error) {
        console.error("Error disconnecting chat session:", error);
        toast({title: "Disconnection Failed", description: "Could not update chat status.", variant: "destructive"})
      }
    }
    setPartner(null);
    setChatSessionId(null);
  }, [chatSessionId, toast]);


  if (!userId || !currentUser) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading user data...</span></div>;
  }

  if (partner && chatSessionId) {
    return (
      <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
        <ChatInterface
          chatId={chatSessionId} // This will be the document ID in CHAT_SESSIONS_COLLECTION
          chatMode="random" // ChatInterface will use this to construct path like `random_chat_sessions_pool/${chatSessionId}/messages`
          chatTitle={`Chat with ${partner.name}`}
          partner={partner}
          showDisconnectButton={true}
          onDisconnect={handleDisconnect}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <UserCheck className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">Ready for a Random Chat?</CardTitle>
          <CardDescription>
            Click the button below to connect with a random user.
            Be respectful and enjoy the conversation!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSearching || (!partner && chatSessionId) ? (
            <>
              <Button disabled className="w-full py-3 text-lg">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isSearching ? 'Searching...' : 'Waiting for Partner...'}
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Connecting you with a random user. This may take a moment.
              </p>
            </>
          ) : (
            <>
              <Button onClick={findPartner} className="w-full py-3 text-lg">
                Find Partner
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Click "Find Partner" to start a new anonymous chat.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
