"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Search, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FindFriendsPage() {
  const [uidInput, setUidInput] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uidInput.trim()) {
      toast({
        title: "Invalid UID",
        description: "Please enter a User ID to search.",
        variant: "destructive",
      });
      return;
    }
    // In a real app, you'd search Firestore for this UID.
    // For now, we just navigate to a private chat page with this UID.
    // This simulates finding the user and opening a chat.
    router.push(`/chat/private/${uidInput.trim()}`);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">Find Friends</CardTitle>
          <CardDescription>
            Enter the User ID (UID) of a friend to start a private conversation.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSearch}>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter Friend's User ID (e.g., user_abc123)"
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                className="pl-10 py-3 text-base"
                aria-label="Friend's User ID"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              User IDs are unique identifiers assigned to each user. You can share your UID from your profile.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full py-3 text-lg">
              <Search className="mr-2 h-5 w-5" />
              Search and Chat
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
