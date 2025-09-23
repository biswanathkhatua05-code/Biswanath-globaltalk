
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Paperclip, Mic, StopCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatInputBarProps {
  onSendMessage: (messageText: string, voiceNoteDetails?: { voiceNoteUrl: string, fileName: string }) => void;
  isLoggedIn: boolean;
  isModerating: boolean;
  isCallActive: boolean; // Includes both video and voice calls
}

export function ChatInputBar({ onSendMessage, isLoggedIn, isModerating, isCallActive }: ChatInputBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micPermissionStatus, setMicPermissionStatus] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    setMicPermissionStatus('pending');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionStatus('granted');
      
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
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            onSendMessage("", { voiceNoteUrl: base64data, fileName: `Voice Note ${new Date().toLocaleTimeString()}.webm` });
        };
        
        stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: 'Recording Started', description: 'Click again to stop and send.', variant: 'default' });
  
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
      toast({ title: 'Recording Stopped', description: 'Sending voice note...', variant: 'default' });
    }
  };

  const handleMicButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (micPermissionStatus === 'denied') {
        toast({
          title: 'Microphone Access Required',
          description: 'Please enable permissions and try again.',
          variant: 'destructive',
        });
        return;
      }
      startRecording();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
        onSendMessage(inputValue);
        setInputValue('');
    }
  };

  const isDisabled = !isLoggedIn || isModerating || isCallActive || isRecording || (micPermissionStatus === 'pending');

  return (
    <footer className="p-4 border-t bg-background/80 backdrop-blur-sm shrink-0">
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                type="button" 
                onClick={handleMicButtonClick}
                disabled={!isLoggedIn || isModerating || isCallActive || (micPermissionStatus === 'denied' && !isRecording)}
              >
                {isRecording ? <StopCircle className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isRecording ? "Stop & Send" : "Record Voice Note"}</p></TooltipContent>
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
          disabled={isDisabled}
          className="flex-1 text-sm"
          aria-label="Chat message input"
        />
        <Button type="submit" size="icon" disabled={!inputValue.trim() || isDisabled} aria-label="Send message">
          <Send className="h-5 w-5" />
        </Button>
      </form>
      {!isLoggedIn && (
        <p className="mt-2 text-xs text-destructive flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" /> You must be connected to send messages.
        </p>
      )}
      {isCallActive && (
         <p className="mt-2 text-xs text-muted-foreground text-center">
          Message input disabled during a call.
         </p>
       )}
       {isRecording && (
          <p className="mt-2 text-xs text-destructive text-center flex items-center justify-center">
              <Mic className="h-4 w-4 mr-1 animate-pulse" /> Recording voice note...
          </p>
       )}
    </footer>
  );
}
