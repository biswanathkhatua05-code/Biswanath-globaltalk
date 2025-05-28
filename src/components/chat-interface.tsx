
"use client";
import type { Message, User, ChatMode } from '@/lib/types';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { Send, Paperclip, Mic, Video, Phone, AlertCircle, LogOut, Bot, VideoOff, XCircle, Loader2 } from 'lucide-react';
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

  const handleVideoCallClick = useCallback(() => {
    setShowVideoCall(prev => {
      const newShowVideoCallState = !prev;
      if (!newShowVideoCallState) { // Turning off video call
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        setHasCameraPermission(null);
      }
      return newShowVideoCallState;
    });
  }, []);

  useEffect(() => {
    const getCameraStream = async () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
          });
        }
      } else {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access or you are in an insecure context.',
        });
      }
    };

    if (showVideoCall) {
      getCameraStream();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => { // Cleanup on component unmount or if showVideoCall changes triggering re-run before this finishes
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showVideoCall, toast]);


  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-xl overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 min-w-0"> {/* Added min-w-0 for truncation */}
          {partner && <UserAvatar user={partner} className="h-8 w-8"/>}
          <h2 className="text-lg font-semibold text-foreground truncate" title={chatTitle}>{chatTitle}</h2>
        </div>
        <div className="flex items-center gap-1 shrink-0"> {/* Added shrink-0 */}
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
        <div className="flex-1 p-4 flex flex-col items-center justify-start bg-background overflow-auto">
          <p className="text-sm text-muted-foreground mb-2">Your Video Feed</p>
          <video ref={videoRef} className="w-full max-w-xl aspect-video rounded-md bg-black" autoPlay muted playsInline />
          {hasCameraPermission === false && (
            <Alert variant="destructive" className="mt-4 w-full max-w-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>
                Could not access camera. Please enable camera permissions in your browser settings and refresh.
              </AlertDescription>
            </Alert>
          )}
          {hasCameraPermission === null && !videoRef.current?.srcObject && (
             <div className="mt-4 text-muted-foreground p-4 border rounded-md w-full max-w-xl flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Requesting camera access...
             </div>
          )}
          <Button onClick={handleVideoCallClick} variant="outline" className="mt-4">
            <XCircle className="mr-2 h-4 w-4" /> Close Video Feed
          </Button>
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
              <TooltipTrigger asChild><Button variant="ghost" size="icon" type="button" disabled><Mic className="h-5 w-5" /></Button></TooltipTrigger>
              <TooltipContent><p>Voice Note (Coming Soon)</p></TooltipContent>
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
            disabled={!isLoggedIn || isModerating || showVideoCall}
            className="flex-1 text-sm"
            aria-label="Chat message input"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || !isLoggedIn || isModerating || showVideoCall} aria-label="Send message">
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
      </footer>
    </div>
  );
}
// Need to import Loader2 if it's used in the video panel's loading state.
// It is used in src/app/chat/global/page.tsx and other pages, so it is available. Let's add the import to be safe.
// import { Loader2 } from 'lucide-react';
// Okay, looking at existing imports, Bot is used for moderation loading, Loader2 is used in other pages for page loading.
// Using Loader2 for consistency for "loading" state.
// Ah, VideoOff, XCircle are newly added. Bot, Send etc were already there.
// Need to add Loader2 in the imports too.
// const { Loader2, Users } from 'lucide-react'; // From global chat page
// So: Send, Paperclip, Mic, Video, Phone, AlertCircle, LogOut, Bot, VideoOff, XCircle, Loader2
