
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AtSign, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      // In a real app, you would fetch user data from Firestore.
      // For this demo, we'll create placeholder data based on the UID.
      const fetchedUser: User = {
        id: userId,
        name: `User ${userId.substring(0, 6)}...`,
        avatarUrl: `https://placehold.co/128x128/78909C/FFFFFF?text=${userId.charAt(0).toUpperCase()}`,
      };
      setUser(fetchedUser);
      setIsLoading(false);
    }
  }, [userId]);

  const copyUidToClipboard = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "The user's ID has been copied.",
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy Failed",
        description: "Could not copy the ID to clipboard.",
        variant: "destructive",
      });
    });
  };

  if (isLoading || !user) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="flex items-center mb-6">
           <Skeleton className="h-10 w-10 rounded-md" />
           <Skeleton className="h-6 w-40 ml-4" />
        </div>
        <Card className="shadow-lg">
          <CardHeader className="text-center items-center">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <Card className="shadow-lg border-2 border-primary/20">
            <CardHeader className="text-center items-center bg-gradient-to-b from-primary/10 to-transparent pt-10">
                <UserAvatar user={user} className="h-32 w-32 border-4 border-background shadow-md" />
                <CardTitle className="mt-4 text-3xl font-bold">{user.name}</CardTitle>
                <CardDescription>A member of the GlobaTalk Lite community.</CardDescription>
            </CardHeader>
            <CardContent className="mt-6 space-y-4 px-8 pb-8">
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                    <div className="flex items-center">
                        <AtSign className="h-5 w-5 text-muted-foreground mr-3" />
                        <p className="text-sm font-mono text-muted-foreground truncate">{user.id}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={copyUidToClipboard}>
                        <Copy className="h-5 w-5" />
                    </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground pt-4">
                    You can share your own ID with friends to start a private chat. Find your ID in the sidebar.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
