
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

export default function FindFriendsPage() {
  const [uidInput, setUidInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { userId } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uidInput.trim() || uidInput.trim() === userId) {
      toast({
        title: "Invalid User ID",
        description: "Please enter a valid User ID that is not your own.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const friendId = uidInput.trim();
      const userRef = doc(firestore, 'users', friendId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // User found, navigate to the private chat page
        toast({
            title: "User Found!",
            description: `Starting a chat with ${userSnap.data().name || 'user'}.`,
        });
        router.push(`/chat/private/${friendId}`);
      } else {
        // User does not exist
        toast({
          title: "User Not Found",
          description: "The User ID you entered does not exist. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
        console.error("Error searching for user:", error);
        toast({
          title: "Search Error",
          description: "Something went wrong while searching. Please try again.",
          variant: "destructive",
        });
    } finally {
        setIsSearching(false);
    }
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
                disabled={isSearching}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              User IDs are unique identifiers assigned to each user. You can share your UID from your profile.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full py-3 text-lg" disabled={isSearching}>
              {isSearching ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Searching...</>
              ) : (
                <><Search className="mr-2 h-5 w-5" /> Search and Chat</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
