
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, UserPlus, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      const fetchUserData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const userRef = doc(firestore, 'users', userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser({ id: userSnap.id, ...userSnap.data() } as User);
          } else {
            setError("User not found.");
          }
        } catch (err) {
            console.error("Error fetching user profile:", err);
            setError("Failed to load profile.");
        } finally {
            setIsLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [userId]);

  const handleMessage = () => {
    router.push(`/chat/private/${userId}`);
  };

  const handleFollow = () => {
    toast({
      title: "Followed!",
      description: "You are now following this user (feature coming soon).",
    });
  };

  if (isLoading) {
    return (
        <div className="container mx-auto py-4 sm:py-8 max-w-md">
            <div className="flex items-center mb-4">
                <Skeleton className="h-9 w-24 rounded-md" />
            </div>
            <Card className="w-full shadow-lg rounded-xl border-border/60 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="text-center sm:text-left flex-1 mt-4 sm:mt-0">
                        <Skeleton className="h-8 w-32" />
                        <div className="mt-3 grid grid-cols-3 gap-4">
                            <div className="text-center"><Skeleton className="h-5 w-8 mx-auto"/><Skeleton className="h-4 w-12 mx-auto mt-1"/></div>
                            <div className="text-center"><Skeleton className="h-5 w-10 mx-auto"/><Skeleton className="h-4 w-16 mx-auto mt-1"/></div>
                            <div className="text-center"><Skeleton className="h-5 w-10 mx-auto"/><Skeleton className="h-4 w-16 mx-auto mt-1"/></div>
                        </div>
                    </div>
                </div>
                 <div className="mt-6 space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                </div>
                <div className="mt-6 p-3 rounded-lg border">
                    <Skeleton className="h-4 w-48"/>
                </div>
                <div className="mt-6">
                     <Skeleton className="h-5 w-20 mb-4" />
                     <div className="grid grid-cols-3 gap-2">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="aspect-square w-full rounded-lg" />
                     </div>
                </div>
            </Card>
        </div>
    );
  }

  if (error || !user) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold">Profile Not Found</h2>
            <p className="text-muted-foreground">{error || "The user you are looking for does not exist."}</p>
            <Button variant="outline" onClick={() => router.back()} className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
            </Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 max-w-md">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 hidden sm:inline-flex">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <Card className="w-full shadow-lg rounded-xl border-border/60">
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-4">
                    <UserAvatar user={user} className="h-24 w-24 text-lg border-2" data-ai-hint="profile avatar" />
                    <div className="text-center sm:text-left flex-1 mt-4 sm:mt-0">
                        <h1 className="text-2xl font-bold">{user.name}</h1>
                        <div className="mt-3 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-lg font-bold">120</p>
                                <p className="text-xs text-muted-foreground">Post</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold">124K</p>
                                <p className="text-xs text-muted-foreground">Followers</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold">500</p>
                                <p className="text-xs text-muted-foreground">Following</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6">
                    <h3 className="text-sm font-semibold">Bio</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Exploring new connections on GlobaTalk Lite. Let's chat!
                    </p>
                     <Link href="#" className="flex items-center gap-1 text-sm text-blue-500 hover:underline mt-1">
                       <LinkIcon className="h-3 w-3" />
                       example.com/link
                    </Link>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button onClick={handleFollow} className="w-full"><UserPlus className="mr-2 h-4 w-4"/>Follow</Button>
                    <Button variant="secondary" onClick={handleMessage} className="w-full"><MessageSquare className="mr-2 h-4 w-4"/>Message</Button>
                </div>

                 <div className="mt-6 text-center text-sm p-3 rounded-lg border bg-muted/40">
                    <p className="text-muted-foreground">Highlight expires in 1 week</p>
                </div>
                
                <div className="mt-6">
                    <h3 className="text-lg font-bold">Media</h3>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                           <div key={i} className="aspect-square rounded-lg bg-muted overflow-hidden">
                                <img src={`https://placehold.co/150x150/f0f0f0/cccccc`} alt={`Media ${i + 1}`} className="h-full w-full object-cover" data-ai-hint="gallery photo" />
                           </div>
                        ))}
                    </div>
                </div>

            </CardContent>
        </Card>
    </div>
  );
}

    