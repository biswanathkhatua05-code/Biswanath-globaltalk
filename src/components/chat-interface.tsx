
"use client";
import type { Message, User, ChatMode } from '@/lib/types';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { Send, Paperclip, Mic, Video, Phone, AlertCircle, LogOut, Bot, VideoOff, XCircle, Loader2, StopCircle, MicOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useChatModeration } from '@/hooks/use-chat-moderation';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from '@/components/user-avatar';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  chatId: string; // Unique ID for this chat session/room
  chatMode: ChatMode;
  chatTitle?: string;
  initialMessages?: Message[];
  onSendMessage?: (message: Message) => Promise<void>; // For "sending" to backend
  showDisconnectButton?: boolean;
  onDisconnect?: () => void;
  partner?: User; // For 1-on-1 chats
}

export function ChatInterface({
  chatId,
  chatMode,
  chatTitle = "Chat",
  initialMessages = [],
  onSendMessage,
  showDisconnectButton = false,
  onDisconnect,
  partner,
}: ChatInterfaceProps) {
  const { userId, isLoggedIn } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const { checkMessage, isLoading: isModerating, error: moderationError } = useChatModeration();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [showVideoCall, setShowVideoCall] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);


  const [isRecording, setIsRecording] = useState(false);
  const [micPermissionStatus, setMicPermissionStatus] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);


  const currentUser: User | undefined = userId ? { id: userId, name: 'You' } : undefined;

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

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !currentUser || !isLoggedIn) return;

    const tempMessageId = `msg_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempMessageId,
      text: inputValue,
      timestamp: Date.now(),
      user: currentUser,
      isSender: true,
      status: 'sending',
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = inputValue;
    setInputValue('');

    try {
      const moderationResult = await checkMessage({ message: messageToSend, userUid: currentUser.id });

      if (!moderationResult.isSafe) {
        setMessages(prev => prev.map(m => m.id === tempMessageId ? { ...m, status: 'moderated', moderationReason: moderationResult.reason || 'Content policy violation' } : m));
        toast({
          title: "Message Moderated",
          description: moderationResult.reason || "Your message violates our content policy and was not sent.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      if (onSendMessage) {
        await onSendMessage(optimisticMessage);
      }
      
      setMessages(prev => prev.map(m => m.id === tempMessageId ? { ...m, status: 'sent' } : m));

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.map(m => m.id === tempMessageId ? { ...m, status: 'failed' } : m));
      toast({
        title: "Message Failed",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    }
  }, [inputValue, currentUser, isLoggedIn, checkMessage, toast, onSendMessage]);

  const stopMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleVideoCallClick = useCallback(() => {
    setShowVideoCall(prev => {
      const newShowVideoCallState = !prev;
      if (!newShowVideoCallState) { // Turning off video call
        stopMediaStream();
        setHasCameraPermission(null);
        setIsMicMuted(false);
        setIsCameraOff(false);
      }
      return newShowVideoCallState;
    });
  }, [stopMediaStream]);

  useEffect(() => {
    const getMediaStream = async () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(null); // Reset while requesting
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          // Set initial mute and camera off states based on stream tracks
          stream.getAudioTracks().forEach(track => track.enabled = !isMicMuted);
          stream.getVideoTracks().forEach(track => track.enabled = !isCameraOff);

        } catch (error) {
          console.error('Error accessing media devices:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Media Access Denied',
            description: 'Please enable camera and microphone permissions in your browser settings.',
          });
          stopMediaStream(); // Ensure stream is stopped if permission fails
          setShowVideoCall(false); // Close video panel if permissions fail
        }
      } else {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Not Supported',
          description: 'Your browser does not support camera/microphone access or you are in an insecure context.',
        });
        setShowVideoCall(false);
      }
    };

    if (showVideoCall) {
      getMediaStream();
    } else {
      stopMediaStream();
    }

    return () => {
      stopMediaStream();
    };
  }, [showVideoCall, toast, stopMediaStream, isMicMuted, isCameraOff]);


  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMicMuted(!audioTracks[0].enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsCameraOff(!videoTracks[0].enabled);
      }
    }
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
        
        const tempMessageId = `msg_vn_${Date.now()}`;
        const optimisticMessage: Message = {
          id: tempMessageId,
          text: '', 
          timestamp: Date.now(),
          user: currentUser,
          isSender: true,
          status: 'sending',
          voiceNoteUrl: audioUrl,
          fileName: `Voice Note ${new Date().toLocaleTimeString()}.webm`,
        };
  
        setMessages(prev => [...prev, optimisticMessage]);
  
        if (onSendMessage) {
          try {
            await onSendMessage(optimisticMessage);
            setMessages(prev => prev.map(m => m.id === tempMessageId ? { ...m, status: 'sent' } : m));
          } catch (error) {
            console.error("Error sending voice note message:", error);
            setMessages(prev => prev.map(m => m.id === tempMessageId ? { ...m, status: 'failed' } : m));
          }
        } else {
          setMessages(prev => prev.map(m => m.id === tempMessageId ? { ...m, status: 'sent' } : m));
        }
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
                      onClick={handleVideoCallClick}
                      className={cn("text-muted-foreground hover:text-primary", showVideoCall && "text-primary bg-accent")}
                      disabled={isRecording || micPermissionStatus === 'pending'}
                    >
                      {showVideoCall ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showVideoCall ? "Hide Video Feed" : "Show Video Feed"}</p>
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
                    <p>Voice Call - Rs. 20/month (Subscription Required)</p>
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
        <div className="flex-1 p-4 flex flex-col items-center justify-center bg-black relative overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-contain scale-x-[-1]" autoPlay muted playsInline />
          
          {hasCameraPermission === false && (
            <Alert variant="destructive" className="absolute top-4 left-1/2 -translate-x-1/2 w-auto max-w-md z-20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Media Access Denied</AlertTitle>
              <AlertDescription>
                Could not access camera/microphone. Please enable permissions and refresh.
              </AlertDescription>
            </Alert>
          )}
          {hasCameraPermission === null && (
             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="ml-2 text-white">Requesting media access...</p>
             </div>
          )}

          {hasCameraPermission === true && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 p-3 bg-black/50 rounded-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={toggleMic} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full p-3">
                      {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{isMicMuted ? "Unmute Microphone" : "Mute Microphone"}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={toggleCamera} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full p-3">
                      {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{isCameraOff ? "Turn Camera On" : "Turn Camera Off"}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleVideoCallClick} variant="destructive" size="icon" className="bg-red-600 hover:bg-red-700 rounded-full p-3">
                      <XCircle className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>End Call</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
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
            handleSendMessage();
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
                  disabled={!isLoggedIn || isModerating || showVideoCall || micPermissionStatus === 'pending' || (micPermissionStatus === 'denied' && !isRecording)}
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

