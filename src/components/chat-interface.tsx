"use client";
import type { Message, User, ChatMode } from '@/lib/types';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { Send, Paperclip, Mic, Video, Phone, AlertCircle, LogOut, Bot } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useChatModeration } from '@/hooks/use-chat-moderation';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from './ui/separator';

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

  const currentUser: User | undefined = userId ? { id: userId, name: 'You' } : undefined;

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

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

      // Simulate sending to backend
      if (onSendMessage) {
        await onSendMessage(optimisticMessage); // Or a modified message based on backend confirmation
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


  const PaidFeatureButton = ({ icon: Icon, label, price }: { icon: React.ElementType, label: string, price: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="text-muted-foreground" disabled>
            <Icon className="mr-2 h-4 w-4" /> {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label} - {price}/month (Subscription Required)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-xl overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {partner && <UserAvatar user={partner} className="h-8 w-8"/>}
          <h2 className="text-lg font-semibold text-foreground">{chatTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
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

      <footer className="p-4 border-t bg-background/80 backdrop-blur-sm">
        {chatMode !== 'global' && (
          <div className="flex gap-2 mb-3 pb-3 border-b border-dashed">
            <PaidFeatureButton icon={Video} label="Video Call" price="Rs. 49" />
            <PaidFeatureButton icon={Phone} label="Voice Call" price="Rs. 20" />
          </div>
        )}
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
            disabled={!isLoggedIn || isModerating}
            className="flex-1 text-sm"
            aria-label="Chat message input"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || !isLoggedIn || isModerating} aria-label="Send message">
            <Send className="h-5 w-5" />
          </Button>
        </form>
        {!isLoggedIn && (
          <p className="mt-2 text-xs text-destructive flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" /> You must be connected to send messages.
          </p>
        )}
      </footer>
    </div>
  );
}
