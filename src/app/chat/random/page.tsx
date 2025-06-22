
"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/chat-interface';
import type { User } from '@/lib/types';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, limit, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const CHAT_SESSIONS_COLLECTION = 'random_chat_sessions_pool';

export default function RandomChatPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const { userId, firebaseUser } = useAuth();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const isWaiting = !partner && chatSessionId;


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
      
      const q = query(
        sessionsRef, 
        where("status", "==", "waiting"), 
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);

      const sessionDoc = querySnapshot.docs.find(doc => doc.data().userId1 !== currentUser.id);

      if (sessionDoc) {
        const sessionData = sessionDoc.data();
        const newPartnerUser = sessionData.user1 as User;

        await updateDoc(doc(firestore, CHAT_SESSIONS_COLLECTION, sessionDoc.id), {
          userId2: currentUser.id,
          user2: currentUser,
          status: "active",
          updatedAt: serverTimestamp(),
        });
        
        setPartner(newPartnerUser);
        setChatSessionId(sessionDoc.id);
        toast({ title: "Partner Found!", description: `You are now chatting with ${newPartnerUser.name}.` });
        
      } else {
        const newSessionRef = await addDoc(sessionsRef, {
          userId1: currentUser.id,
          user1: currentUser,
          status: "waiting",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setChatSessionId(newSessionRef.id);
        toast({ title: "Searching...", description: "Waiting for a partner to connect. This may take a moment."});

        const unsub = onSnapshot(doc(firestore, CHAT_SESSIONS_COLLECTION, newSessionRef.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === "active" && data.user2) {
                    setPartner(data.user2 as User);
                    toast({ title: "Partner Connected!", description: `You are now chatting with ${data.user2.name}.` });
                    unsub();
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
        await updateDoc(doc(firestore, CHAT_SESSIONS_COLLECTION, chatSessionId), {
          status: "disconnected",
          disconnectedAt: serverTimestamp(),
        });
        toast({title: "Disconnected", description: "You have left the chat."})
      } catch (error) {
        console.error("Error disconnecting chat session:", error);
        toast({title: "Disconnection Failed", description: "Could not update chat status.", variant: "destructive"})
      }
    }
    setPartner(null);
    setChatSessionId(null);
  }, [chatSessionId, toast]);

  // Effect to manage camera preview while waiting
  useEffect(() => {
    async function getCameraPreview() {
      try {
        setHasCameraPermission(null);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error("Error accessing camera for preview:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description: "Please enable camera permissions in your browser settings to use video chat.",
        });
      }
    }

    if (isWaiting) {
      getCameraPreview();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isWaiting, toast]);


  // Effect to handle automatic disconnect on component unmount (e.g., navigating away)
  useEffect(() => {
    return () => {
      if (chatSessionId) {
        // Automatically update the session to disconnected when the user leaves the page.
        // No toast is shown here to avoid being intrusive.
        const sessionRef = doc(firestore, CHAT_SESSIONS_COLLECTION, chatSessionId);
        updateDoc(sessionRef, {
            status: "disconnected",
            disconnectedAt: serverTimestamp(),
        }).catch(err => console.error("Error during auto-disconnect cleanup:", err));
      }
    };
  }, [chatSessionId]);


  if (!userId || !currentUser) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading user data...</span></div>;
  }

  if (partner && chatSessionId) {
    return (
      <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
        <ChatInterface
          chatId={chatSessionId}
          chatMode="random"
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
            {isWaiting ? "You are in the queue. We're finding a partner for you." : "Click the button below to connect with a random user."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSearching || isWaiting ? (
             <div className="space-y-4">
              {isWaiting && hasCameraPermission !== false && (
                <div className="relative aspect-video w-full max-w-sm mx-auto bg-muted rounded-lg overflow-hidden border">
                  <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                  {hasCameraPermission === null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-white"/>
                      <p className="ml-2 text-white">Starting camera...</p>
                    </div>
                  )}
                </div>
              )}
              {hasCameraPermission === false && isWaiting && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                      You can still connect, but video chat will not be available.
                    </AlertDescription>
                  </Alert>
              )}
              <Button disabled className="w-full py-3 text-lg">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isSearching ? 'Searching...' : 'Waiting for Partner...'}
              </Button>
              <p className="text-sm text-muted-foreground">
                {isWaiting ? "You can check your video above while you wait." : "Connecting you..."}
              </p>
            </div>
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
