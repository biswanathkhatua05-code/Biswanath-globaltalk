
"use client";
import type { Message, User, ChatMode } from '@/lib/types';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { Send, Paperclip, Mic, Video, Phone, AlertCircle, LogOut, Bot, VideoOff, XCircle, Loader2, StopCircle, MicOff, SwitchCamera, Minus, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useChatModeration } from '@/hooks/use-chat-moderation';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from '@/components/user-avatar';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { firestore } from '@/lib/firebase'; // Import firestore
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp, where, limit, doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc, getDocs } from 'firebase/firestore'; // Firestore imports

interface ChatInterfaceProps {
  chatId: string; 
  chatMode: ChatMode;
  chatTitle?: string;
  showDisconnectButton?: boolean;
  onDisconnect?: () => void;
  partner?: User; 
}

// STUN servers configuration for WebRTC
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};


export function ChatInterface({
  chatId,
  chatMode,
  chatTitle = "Chat",
  showDisconnectButton = false,
  onDisconnect,
  partner,
}: ChatInterfaceProps) {
  const { userId, isLoggedIn, firebaseUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const { checkMessage, isLoading: isModerating, error: moderationError } = useChatModeration();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // States and Refs for Video Calling
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');

  const [isRecording, setIsRecording] = useState(false);
  const [micPermissionStatus, setMicPermissionStatus] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentUser: User | undefined = firebaseUser ? { id: firebaseUser.uid, name: firebaseUser.displayName || 'You', avatarUrl: firebaseUser.photoURL || undefined } : undefined;

  useEffect(() => {
    if (typeof window !== "undefined" && 'pictureInPictureEnabled' in document) {
        setIsPiPSupported(document.pictureInPictureEnabled);
    }
  }, []);

  const getMessagesCollectionPath = useCallback(() => {
    if (!chatId) return null;
    switch (chatMode) {
      case 'global':
        return 'global_messages';
      case 'random':
        return `random_chat_sessions_pool/${chatId}/messages`;
      case 'private':
        return `chat_sessions/${chatId}/messages`;
      default:
        console.error("Invalid chat mode provided:", chatMode);
        return null;
    }
  }, [chatMode, chatId]);


  useEffect(() => {
    if (!isLoggedIn || !chatId) return;
    
    const messagesCollectionPath = getMessagesCollectionPath();
    if (!messagesCollectionPath) return;

    const q = query(collection(firestore, messagesCollectionPath), orderBy("timestamp", "asc"), limit(100));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          text: data.text,
          timestamp: data.timestamp,
          user: data.user,
          userId: data.userId,
          isSender: data.userId === userId,
          status: 'sent',
          voiceNoteUrl: data.voiceNoteUrl,
          fileName: data.fileName,
        });
      });
      setMessages(fetchedMessages);
    }, (error) => {
      console.error("Error fetching messages from Firestore:", error);
      toast({
        title: "Error Loading Messages",
        description: "Could not fetch messages. Please try again later.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [isLoggedIn, userId, toast, getMessagesCollectionPath, chatId]);


  useEffect(() => {
    if (!showVideoCall && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, showVideoCall]);

  useEffect(() => {
    if (moderationError) {
      toast({
        title: "Moderation Error",
        description: moderationError,
        variant: "destructive",
      });
    }
  }, [moderationError, toast]);

  const handleSendMessage = useCallback(async (messageText: string, voiceNoteDetails?: { voiceNoteUrl: string, fileName: string }) => {
    if ((!messageText.trim() && !voiceNoteDetails) || !currentUser || !isLoggedIn) return;

    const messagesCollectionPath = getMessagesCollectionPath();
    if (!messagesCollectionPath) {
      toast({ title: "Cannot Send Message", description: "Invalid chat session.", variant: "destructive" });
      return;
    }

    try {
      if (!voiceNoteDetails) { 
        const moderationResult = await checkMessage({ message: messageText, userUid: currentUser.id });
        if (!moderationResult.isSafe) {
          toast({
            title: "Message Moderated",
            description: moderationResult.reason || "Your message violates our content policy and was not sent.",
            variant: "destructive",
            duration: 5000,
          });
          return; 
        }
      }

      const messageData: Omit<Message, 'id' | 'isSender' | 'status'> = {
        text: messageText,
        timestamp: serverTimestamp(),
        user: {
          id: currentUser.id,
          name: currentUser.name || "Anonymous",
          avatarUrl: currentUser.avatarUrl || `https://placehold.co/100x100/78909C/FFFFFF?text=${(currentUser.name || 'A').charAt(0).toUpperCase()}`,
        },
        userId: currentUser.id,
        ...(voiceNoteDetails && { voiceNoteUrl: voiceNoteDetails.voiceNoteUrl, fileName: voiceNoteDetails.fileName }),
      };

      await addDoc(collection(firestore, messagesCollectionPath), messageData);
    } catch (error) {
      console.error("Error sending message to Firestore:", error);
      toast({
        title: "Message Failed",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentUser, isLoggedIn, checkMessage, toast, getMessagesCollectionPath]);

  const handleEndCall = useCallback(() => {
    setIsCallActive(false);
    setShowVideoCall(false);
  }, []);

  const handleEnterPiP = useCallback(async () => {
    if (localVideoRef.current && document.pictureInPictureEnabled && !document.pictureInPictureElement) {
        try {
            await localVideoRef.current.requestPictureInPicture();
            setShowVideoCall(false); // Hide the main video UI. Call remains active.
        } catch(error) {
            toast({
                variant: 'destructive',
                title: 'PiP Error',
                description: 'Could not enter Picture-in-Picture mode.',
            });
            console.error("Error entering PiP mode:", error);
        }
    }
  }, [toast]);


  const handleHeaderVideoClick = useCallback(() => {
    if (!isCallActive) {
      setIsCallActive(true);
      setShowVideoCall(true);
      return;
    }
    
    if (!showVideoCall && document.pictureInPictureElement) {
        document.exitPictureInPicture();
    }
    setShowVideoCall(prev => !prev);
  }, [isCallActive, showVideoCall]);


  // Effect for the entire WebRTC call lifecycle
  useEffect(() => {
    if (!isCallActive || !chatId) {
      return;
    }

    let unsubscribers: (() => void)[] = [];
    
    const setupCall = async () => {
      // --- Part 1: Get Media Stream ---
      try {
        setHasCameraPermission(null);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode }, audio: true });
        streamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);

        stream.getAudioTracks().forEach(track => track.enabled = !isMicMuted);
        stream.getVideoTracks().forEach(track => track.enabled = !isCameraOff);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Could not access camera/microphone. Please check permissions.',
        });
        handleEndCall();
        return;
      }

      // --- Part 2: Setup WebRTC Peer Connection ---
      const pc = new RTCPeerConnection(servers);
      peerConnectionRef.current = pc;

      // Add local tracks
      streamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, streamRef.current!);
      });

      // Handle remote stream
      const remoteS = new MediaStream();
      setRemoteStream(remoteS);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteS;
      
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          remoteS.addTrack(track);
        });
      };

      // --- Part 3: Signaling via Firestore ---
      const callDocRef = doc(firestore, 'video_calls', chatId);
      const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
      const answerCandidatesRef = collection(callDocRef, 'answerCandidates');

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          const callDoc = await getDoc(callDocRef);
          if (callDoc.exists() && callDoc.data().answer) {
            await addDoc(answerCandidatesRef, event.candidate.toJSON());
          } else {
            await addDoc(offerCandidatesRef, event.candidate.toJSON());
          }
        }
      };
      
      const callDocSnap = await getDoc(callDocRef);

      if (!callDocSnap.exists()) {
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await setDoc(callDocRef, { offer });

        const unsubAnswer = onSnapshot(callDocRef, (snapshot) => {
          const data = snapshot.data();
          if (!pc.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
          }
        });
        unsubscribers.push(unsubAnswer);

        const unsubAnswerCandidates = onSnapshot(answerCandidatesRef, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
          });
        });
        unsubscribers.push(unsubAnswerCandidates);

      } else {
        const offer = callDocSnap.data().offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });
        
        const unsubOfferCandidates = onSnapshot(offerCandidatesRef, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
          });
        });
        unsubscribers.push(unsubOfferCandidates);
      }
    };

    setupCall();

    // --- Cleanup function for this useEffect ---
    return () => {
      // Stop all stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Unsubscribe from all Firestore listeners
      unsubscribers.forEach(unsub => unsub && unsub());

      // Clean up UI state
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setRemoteStream(null);

      // Clean up Firestore signaling documents
      const cleanupFirestore = async (id: string) => {
        try {
          const callDocRef = doc(firestore, 'video_calls', id);
          const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
          const answerCandidatesRef = collection(callDocRef, 'answerCandidates');
          
          const [offerCandidatesSnap, answerCandidatesSnap] = await Promise.all([
            getDocs(offerCandidatesRef),
            getDocs(answerCandidatesRef)
          ]);
          
          const deletePromises: Promise<void>[] = [];
          offerCandidatesSnap.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
          answerCandidatesSnap.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
          await Promise.all(deletePromises);

          await deleteDoc(callDocRef);
        } catch (error) {
          console.error("Error cleaning up call documents:", error);
        }
      };
      if (chatId) {
        cleanupFirestore(chatId);
      }
    };
  }, [isCallActive, chatId, currentFacingMode, isMicMuted, isCameraOff, toast, handleEndCall]);


  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMicMuted(!track.enabled);
      });
    }
  };

  const toggleCamera = () => {
     if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsCameraOff(!track.enabled);
      });
    }
  };

  const handleSwitchCamera = () => {
    setCurrentFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };


  const startRecording = async () => {
    if (!currentUser || !isLoggedIn) return;
    if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
      toast({ title: 'Audio Recording Not Supported', description: 'Your browser does not support audio recording.', variant: 'destructive' });
      setMicPermissionStatus('denied'); 
      return;
    }
  
    setMicPermissionStatus('pending');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionStatus('granted');
  
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        await handleSendMessage("", { voiceNoteUrl: audioUrl, fileName: `Voice Note ${new Date().toLocaleTimeString()}.webm` });
        
        stream.getTracks().forEach(track => track.stop());
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: 'Recording Started', description: 'Click the stop icon to finish.', variant: 'default' });
  
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setMicPermissionStatus('denied');
      toast({
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings to use this feature.',
        variant: 'destructive',
      });
      setIsRecording(false); 
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording Stopped', description: 'Processing voice note...', variant: 'default' });
    }
  };

  const handleMicButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (micPermissionStatus === 'denied') {
        toast({
          title: 'Microphone Access Required',
          description: 'Please enable microphone permissions in your browser settings and try again.',
          variant: 'destructive',
        });
        return;
      }
      startRecording();
    }
  };


  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-xl overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 min-w-0">
          {partner && <UserAvatar user={partner} className="h-8 w-8"/>}
          <h2 className="text-lg font-semibold text-foreground truncate" title={chatTitle}>{chatTitle}</h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {chatMode !== 'global' && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleHeaderVideoClick}
                      className={cn("text-muted-foreground hover:text-primary", isCallActive && "text-primary")}
                      disabled={isRecording || micPermissionStatus === 'pending'}
                    >
                      {showVideoCall ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showVideoCall ? "Hide Video Feed" : isCallActive ? "Show Video Feed" : "Start Video Call"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground" disabled>
                      <Phone className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Voice Call (Coming Soon)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          {chatMode !== 'global' && showDisconnectButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onDisconnect} className="text-destructive hover:bg-destructive/10">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Disconnect Chat</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </header>

      {showVideoCall ? (
        <div className="flex-1 p-0 flex flex-col bg-black relative overflow-hidden">
          {/* Remote User's Video */}
          <video 
            ref={remoteVideoRef}
            className="w-full h-full object-cover bg-neutral-900"
            autoPlay
            playsInline
          />
          {(!remoteStream || remoteStream.getTracks().length === 0) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-neutral-600 pointer-events-none">
                <UserCircle className="w-24 h-24" />
                <p className="mt-4 text-lg">Connecting to {partner?.name || 'your partner'}...</p>
                <p className="text-sm text-neutral-700">(Waiting for user to join)</p>
            </div>
          )}


          {/* Local User's Video (Your camera) */}
          {hasCameraPermission === true && (
            <div className="absolute top-4 right-4 w-40 md:w-48 rounded-lg overflow-hidden z-20 shadow-lg border-2 border-white/20 transition-all duration-300">
              <video 
                ref={localVideoRef} 
                className={cn(
                  "w-full h-full object-cover aspect-[3/4]",
                  currentFacingMode === 'user' && "scale-x-[-1]" 
                )} 
                autoPlay 
                muted 
                playsInline 
              />
            </div>
          )}
          
          {hasCameraPermission === false && (
            <Alert variant="destructive" className="absolute top-4 left-1/2 -translate-x-1/2 w-auto max-w-md z-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Media Access Denied</AlertTitle>
              <AlertDescription>
                Could not access camera/microphone. Please enable permissions.
              </AlertDescription>
            </Alert>
          )}
          {hasCameraPermission === null && (
             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="ml-2 text-white">Requesting media access...</p>
             </div>
          )}

          {/* Controls Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-2 bg-black/75 rounded-full shadow-lg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={toggleMic} size="icon" className="bg-neutral-700/50 hover:bg-neutral-600/70 text-white rounded-full p-3" disabled={!hasCameraPermission}>
                    {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isMicMuted ? "Unmute Microphone" : "Mute Microphone"}</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={toggleCamera} size="icon" className="bg-neutral-700/50 hover:bg-neutral-600/70 text-white rounded-full p-3" disabled={!hasCameraPermission}>
                    {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isCameraOff ? "Turn Camera On" : "Turn Camera Off"}</p></TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleSwitchCamera} size="icon" className="bg-neutral-700/50 hover:bg-neutral-600/70 text-white rounded-full p-3" disabled={!hasCameraPermission}>
                    <SwitchCamera className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Switch Camera</p></TooltipContent>
              </Tooltip>

              {isPiPSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleEnterPiP} size="icon" className="bg-neutral-700/50 hover:bg-neutral-600/70 text-white rounded-full p-3" disabled={!hasCameraPermission}>
                      <Minus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Picture-in-Picture</p></TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleEndCall} size="icon" className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3">
                    <XCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>End Call</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isModerating && (
              <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4 mr-2 animate-spin" /> Checking message...
              </div>
            )}
          </div>
        </ScrollArea>
      )}


      <footer className="p-4 border-t bg-background/80 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValue.trim()) {
                handleSendMessage(inputValue);
                setInputValue('');
            }
          }}
          className="flex items-center gap-2"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  type="button" 
                  onClick={handleMicButtonClick}
                  disabled={!isLoggedIn || isModerating || showVideoCall || isRecording || micPermissionStatus === 'pending' || (micPermissionStatus === 'denied' && !isRecording)}
                >
                  {isRecording ? <StopCircle className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isRecording ? "Stop Recording" : (micPermissionStatus === 'denied' ? "Mic Permission Denied" : "Record Voice Note")}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" type="button" disabled><Paperclip className="h-5 w-5" /></Button></TooltipTrigger>
              <TooltipContent><p>Attach File (Coming Soon)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            type="text"
            placeholder={isLoggedIn ? "Type a message..." : "Please log in to chat."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!isLoggedIn || isModerating || showVideoCall || isRecording}
            className="flex-1 text-sm"
            aria-label="Chat message input"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || !isLoggedIn || isModerating || showVideoCall || isRecording} aria-label="Send message">
            <Send className="h-5 w-5" />
          </Button>
        </form>
        {!isLoggedIn && (
          <p className="mt-2 text-xs text-destructive flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" /> You must be connected to send messages.
          </p>
        )}
         {showVideoCall && (
           <p className="mt-2 text-xs text-muted-foreground text-center">
            Message input disabled during video call.
           </p>
         )}
         {isRecording && (
            <p className="mt-2 text-xs text-destructive text-center flex items-center justify-center">
                <Mic className="h-4 w-4 mr-1 animate-pulse" /> Recording voice note... Message input disabled.
            </p>
         )}
         {micPermissionStatus === 'denied' && !isRecording && (
            <p className="mt-2 text-xs text-destructive text-center">
                Microphone permission denied. Please enable it in your browser settings.
            </p>
         )}
      </footer>
    </div>
  );
}
