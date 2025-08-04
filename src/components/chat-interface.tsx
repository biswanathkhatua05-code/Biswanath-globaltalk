
"use client";
import type { Message, User, ChatMode } from '@/lib/types';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { Send, Paperclip, Mic, Video, Phone, AlertCircle, LogOut, Bot, VideoOff, XCircle, Loader2, StopCircle, MicOff, SwitchCamera, Minus, UserCircle, PhoneOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useChatModeration } from '@/hooks/use-chat-moderation';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from '@/components/user-avatar';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { firestore, servers } from '@/lib/firebase'; // Import firestore and servers
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp, where, limit, doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc, getDocs } from 'firebase/firestore'; // Firestore imports
import Link from 'next/link';

interface ChatInterfaceProps {
  chatId: string; 
  chatMode: ChatMode;
  chatTitle?: string;
  showDisconnectButton?: boolean;
  onDisconnect?: () => void;
  partner?: User; 
}

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

  // States and Refs for Voice Calling
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [isVoiceCallMuted, setIsVoiceCallMuted] = useState(false);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const voiceCallStreamRef = useRef<MediaStream | null>(null);
  const voiceCallPeerConnectionRef = useRef<RTCPeerConnection | null>(null);

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
    if (!showVideoCall && !isVoiceCallActive && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, showVideoCall, isVoiceCallActive]);

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
            setShowVideoCall(false);
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
    if(isVoiceCallActive) {
       toast({
        title: "Call in Progress",
        description: "You cannot start a video call while in a voice call.",
        variant: "destructive",
      });
      return;
    }
    if (!isCallActive) {
      setIsCallActive(true);
      setShowVideoCall(true);
      return;
    }
    
    if (!showVideoCall && document.pictureInPictureElement) {
        document.exitPictureInPicture();
    }
    setShowVideoCall(prev => !prev);
  }, [isCallActive, isVoiceCallActive, showVideoCall, toast]);

  // --- Voice Call Handlers ---
  const handleEndVoiceCall = useCallback(() => {
    setIsVoiceCallActive(false);
  }, []);

  const handleToggleVoiceCall = useCallback(() => {
    if (isCallActive) {
      toast({
        title: "Call in Progress",
        description: "You cannot start a voice call while in a video call.",
        variant: "destructive",
      });
      return;
    }
    setIsVoiceCallActive(prev => !prev);
  }, [isCallActive, toast]);

  const toggleVoiceCallMic = () => {
    if (voiceCallStreamRef.current) {
      voiceCallStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsVoiceCallMuted(!track.enabled);
      });
    }
  };


  // Effect for the entire Video Call lifecycle
  useEffect(() => {
    if (!isCallActive || !chatId) {
      // Clear any existing call data if the call is not active
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
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
          if (pc.signalingState !== 'closed' && !pc.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
          }
        });
        unsubscribers.push(unsubAnswer);

        const unsubAnswerCandidates = onSnapshot(answerCandidatesRef, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && pc.signalingState !== 'closed') {
              pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
          });
        });
        unsubscribers.push(unsubAnswerCandidates);

      } else {
        const offer = callDocSnap.data().offer;
        if(offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
        }
        
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });
        
        const unsubOfferCandidates = onSnapshot(offerCandidatesRef, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && pc.signalingState !== 'closed') {
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
          const callDocSnap = await getDoc(callDocRef);
          if (callDocSnap.exists()) {
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
          }
        } catch (error) {
          console.error("Error cleaning up call documents:", error);
        }
      };
      if (chatId) {
        cleanupFirestore(chatId);
      }
    };
  }, [isCallActive, chatId, currentFacingMode, toast, handleEndCall]);


  // Effect for the entire Voice Call lifecycle
  useEffect(() => {
    if (!isVoiceCallActive || !chatId || !currentUser) {
       // Cleanup logic
        if (voiceCallPeerConnectionRef.current) {
            voiceCallPeerConnectionRef.current.close();
            voiceCallPeerConnectionRef.current = null;
        }
        if (voiceCallStreamRef.current) {
            voiceCallStreamRef.current.getTracks().forEach(track => track.stop());
            voiceCallStreamRef.current = null;
        }
        return;
    }

    let unsubscribers: (() => void)[] = [];
    const pc = new RTCPeerConnection(servers);
    voiceCallPeerConnectionRef.current = pc;
    
    const setupVoiceCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        voiceCallStreamRef.current = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        stream.getAudioTracks().forEach(track => track.enabled = !isVoiceCallMuted);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          variant: 'destructive',
          title: 'Microphone Access Denied',
          description: 'Please check permissions to start a voice call.',
        });
        handleEndVoiceCall();
        return;
      }
      
      const remoteS = new MediaStream();
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteS;
        remoteAudioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
      
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => remoteS.addTrack(track));
      };

      const callDocRef = doc(firestore, 'voice_calls', chatId);
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
          if (pc.signalingState !== 'closed' && !pc.currentRemoteDescription && data?.answer) {
            pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });
        unsubscribers.push(unsubAnswer);

        const unsubAnswerCandidates = onSnapshot(answerCandidatesRef, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && pc.signalingState !== 'closed') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          });
        });
        unsubscribers.push(unsubAnswerCandidates);
      } else {
        const offer = callDocSnap.data().offer;
        if (offer) {
           await pc.setRemoteDescription(new RTCSessionDescription(offer));
        }
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });

        const unsubOfferCandidates = onSnapshot(offerCandidatesRef, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && pc.signalingState !== 'closed') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          });
        });
        unsubscribers.push(unsubOfferCandidates);
      }
    };

    setupVoiceCall();

    return () => {
      if (voiceCallStreamRef.current) {
        voiceCallStreamRef.current.getTracks().forEach(track => track.stop());
        voiceCallStreamRef.current = null;
      }
      if (voiceCallPeerConnectionRef.current) {
        voiceCallPeerConnectionRef.current.close();
        voiceCallPeerConnectionRef.current = null;
      }
      unsubscribers.forEach(unsub => unsub && unsub());
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
      
      const cleanupFirestore = async (id: string) => {
        try {
          const callDocRef = doc(firestore, 'voice_calls', id);
           const callDocSnap = await getDoc(callDocRef);
           if (callDocSnap.exists()) {
            const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
            const answerCandidatesRef = collection(callDocRef, 'answerCandidates');
            const [offerCandidatesSnap, answerCandidatesSnap] = await Promise.all([getDocs(offerCandidatesRef), getDocs(answerCandidatesRef)]);
            const deletePromises: Promise<void>[] = [];
            offerCandidatesSnap.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
            answerCandidatesSnap.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
            await Promise.all(deletePromises);
            await deleteDoc(callDocRef);
           }
        } catch (error) {
          console.error("Error cleaning up voice call documents:", error);
        }
      };
      if (chatId) {
        cleanupFirestore(chatId);
      }
    };
  }, [isVoiceCallActive, chatId, currentUser, toast, handleEndVoiceCall]);



  const toggleMic = () => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !isMicMuted;
    });
    setIsMicMuted(!isMicMuted);
  };

  const toggleCamera = () => {
     if (!streamRef.current) return;
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
  };

  const handleSwitchCamera = () => {
    setCurrentFacingMode(prevMode => {
        const newMode = prevMode === 'user' ? 'environment' : 'user';
        // Re-trigger the call setup effect with the new facing mode
        // This is a simplified approach. A more advanced one would replace tracks.
        setIsCallActive(false); 
        setTimeout(() => setIsCallActive(true), 100);
        return newMode;
    });
  };

  const startRecording = async () => {
    if (!currentUser || !isLoggedIn) return;
    setMicPermissionStatus('pending');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionStatus('granted');
      
      // Use native MediaRecorder
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        await handleSendMessage("", { voiceNoteUrl: audioUrl, fileName: `Voice Note ${new Date().toLocaleTimeString()}.webm` });
        
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: 'Recording Started', description: 'Recording will stop when you click the button again.', variant: 'default' });
  
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setMicPermissionStatus('denied');
      toast({
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings.',
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
          {partner ? (
            <Link href={`/chat/profile/${partner.id}`} className="flex items-center gap-2 min-w-0 hover:bg-accent/50 p-2 -m-2 rounded-lg transition-colors duration-200">
              <UserAvatar user={partner} className="h-8 w-8"/>
              <h2 className="text-lg font-semibold text-foreground truncate" title={chatTitle}>{chatTitle}</h2>
            </Link>
          ) : (
            <h2 className="text-lg font-semibold text-foreground truncate" title={chatTitle}>{chatTitle}</h2>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {chatMode !== 'global' && !isVoiceCallActive && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleHeaderVideoClick}
                    className={cn("text-muted-foreground hover:text-primary", isCallActive && "text-primary")}
                    disabled={isRecording || micPermissionStatus === 'pending' || isVoiceCallActive}
                  >
                    {showVideoCall ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showVideoCall ? "Hide Video Feed" : isCallActive ? "Show Video Feed" : "Start Video Call"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {chatMode !== 'global' && isVoiceCallActive && (
             <div className="flex items-center gap-1 text-sm font-medium text-primary animate-pulse">
                <Phone className="h-4 w-4"/>
                <span>Voice Call...</span>
             </div>
          )}
          
          {chatMode !== 'global' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={isVoiceCallActive ? toggleVoiceCallMic : handleToggleVoiceCall}
                    className={cn("text-muted-foreground hover:text-primary", isVoiceCallActive && "text-primary")}
                    disabled={isCallActive}
                  >
                    {isVoiceCallActive ? (isVoiceCallMuted ? <MicOff className="h-5 w-5"/> : <Mic className="h-5 w-5"/>) : <Phone className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isVoiceCallActive ? (isVoiceCallMuted ? 'Unmute' : 'Mute') : 'Start Voice Call'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {isVoiceCallActive && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={handleToggleVoiceCall} className="text-destructive hover:bg-destructive/10">
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>End Call</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
          {(!remoteStream || remoteStream.getVideoTracks().length === 0) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-neutral-600 pointer-events-none text-center p-4">
                <UserCircle className="w-24 h-24" />
                <p className="mt-4 text-lg">Waiting for {partner?.name || 'partner'}</p>
                <p className="text-sm text-neutral-700">The call will begin once they join and enable their camera.</p>
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

      {/* Hidden audio element for voice calls */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

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
                  disabled={!isLoggedIn || isModerating || showVideoCall || (micPermissionStatus === 'denied' && !isRecording) || isVoiceCallActive}
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
            disabled={!isLoggedIn || isModerating || showVideoCall || isRecording || isVoiceCallActive}
            className="flex-1 text-sm"
            aria-label="Chat message input"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || !isLoggedIn || isModerating || showVideoCall || isRecording || isVoiceCallActive} aria-label="Send message">
            <Send className="h-5 w-5" />
          </Button>
        </form>
        {!isLoggedIn && (
          <p className="mt-2 text-xs text-destructive flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" /> You must be connected to send messages.
          </p>
        )}
         {(showVideoCall || isVoiceCallActive) && (
           <p className="mt-2 text-xs text-muted-foreground text-center">
            Message input disabled during a call.
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
