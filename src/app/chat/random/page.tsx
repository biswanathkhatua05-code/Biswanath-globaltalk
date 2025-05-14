"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/chat-interface';
import type { User, Message } from '@/lib/types';
import { Loader2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RandomChatPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const { userId } = useAuth();

  const findPartner = () => {
    setIsSearching(true);
    setPartner(null);
    setChatMessages([]); // Clear previous messages

    // Simulate finding a partner
    setTimeout(() => {
      const randomId = `partner_${Math.random().toString(36).substring(2, 9)}`;
      const newPartner: User = {
        id: randomId,
        name: `Stranger ${randomId.substring(0,4)}`,
        avatarUrl: `https://placehold.co/100x100/E0E0E0/757575?text=${randomId.charAt(0).toUpperCase()}`,
      };
      setPartner(newPartner);
      setChatSessionId(`random_chat_${Date.now()}`);
      setIsSearching(false);
      // Add a welcome message from the "partner"
      setChatMessages([{
        id: `welcome_${Date.now()}`,
        text: `Hi there! You've connected with ${newPartner.name}.`,
        timestamp: Date.now(),
        user: newPartner,
        isSender: false,
      }]);
    }, 2000);
  };

  const handleDisconnect = () => {
    setPartner(null);
    setChatSessionId(null);
    setChatMessages([]);
    // Optionally, add a message indicating disconnection
  };

  // Simulate receiving messages from partner for demo
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (partner && userId) {
      intervalId = setInterval(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `partner_msg_${Date.now()}`,
            text: `This is a simulated message from ${partner.name}. Random number: ${Math.floor(Math.random() * 100)}`,
            timestamp: Date.now(),
            user: partner,
            isSender: false,
          }
        ]);
      }, 15000); // Every 15 seconds
    }
    return () => clearInterval(intervalId);
  }, [partner, userId]);


  if (!userId) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading user data...</span></div>;
  }

  if (partner && chatSessionId) {
    return (
      <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]"> {/* Adjust height based on header/footer */}
        <ChatInterface
          chatId={chatSessionId}
          chatMode="random"
          chatTitle={`Chat with ${partner.name}`}
          initialMessages={chatMessages}
          partner={partner}
          showDisconnectButton={true}
          onDisconnect={handleDisconnect}
          // onSendMessage could be implemented to "send" to this simulated partner
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
            Click the button below to connect with a random user from around the globe.
            Be respectful and enjoy the conversation!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSearching ? (
            <Button disabled className="w-full py-3 text-lg">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Searching for a partner...
            </Button>
          ) : (
            <Button onClick={findPartner} className="w-full py-3 text-lg">
              Find Partner
            </Button>
          )}
           {partner === null && !isSearching && (
             <p className="mt-4 text-sm text-muted-foreground">
               Click "Find Partner" to start a new anonymous chat.
             </p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
