
"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from 'next/navigation';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit, increment, runTransaction } from 'firebase/firestore';
import type { Video, Comment, User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Bell, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// Main Component
export default function VideoWatchPage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const { userProfile, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch video, comments, and recommended videos
  const fetchAllData = useCallback(async () => {
    if (!videoId || !isLoggedIn) return;
    
    setIsLoading(true);
    try {
      // Fetch main video
      const videoRef = doc(firestore, 'videos', videoId);
      const videoSnap = await getDoc(videoRef);

      if (!videoSnap.exists()) {
        throw new Error("Video not found. It may have been deleted or the link is incorrect.");
      }
      const videoData = { id: videoSnap.id, ...videoSnap.data() } as Video;
      setVideo(videoData);

      // Increment views
      await runTransaction(firestore, async (transaction) => {
          transaction.update(videoRef, { views: increment(1) });
      });

      // Fetch comments
      const commentsRef = collection(firestore, `videos/${videoId}/comments`);
      const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
      const commentsSnap = await getDocs(commentsQuery);
      const fetchedComments = commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(fetchedComments);
      
      // Fetch recommended videos (excluding the current one)
      const recommendedRef = collection(firestore, 'videos');
      const recommendedQuery = query(recommendedRef, limit(10));
      const recommendedSnap = await getDocs(recommendedQuery);
      const fetchedRecommended = recommendedSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Video))
          .filter(v => v.id !== videoId);
      setRecommended(fetchedRecommended);

    } catch (err) {
      console.error("Error fetching video data:", err);
      // Re-throwing the error to be caught by the nearest error.tsx boundary
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [videoId, isLoggedIn]);


  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    }
  }, [isLoggedIn, fetchAllData]);
  
  const handlePostComment = async () => {
    if (!newComment.trim() || !userProfile || !isLoggedIn) {
        toast({ title: "Cannot post comment", description: "Please write a comment and make sure you are logged in.", variant: "destructive" });
        return;
    }
    setIsSubmittingComment(true);
    try {
        const commentsRef = collection(firestore, `videos/${videoId}/comments`);
        const commentData: Omit<Comment, 'id'> = {
            text: newComment,
            authorId: userProfile.id,
            authorName: userProfile.name || 'Anonymous',
            authorAvatarUrl: userProfile.avatarUrl || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${userProfile.id}`,
            createdAt: serverTimestamp() as any, // Let server generate timestamp
        };
        const docRef = await addDoc(commentsRef, commentData);
        
        // Optimistically update UI
        setComments([{ id: docRef.id, ...commentData, createdAt: new Date() } as any, ...comments]);
        setNewComment("");
        toast({ title: "Comment Posted!", variant: "default" });
    } catch(err) {
        console.error("Error posting comment:", err);
        toast({ title: "Failed to post comment", description: "Please try again.", variant: "destructive" });
    } finally {
        setIsSubmittingComment(false);
    }
  }

  const handleLike = async () => {
      if (!userProfile || !videoId) return;
      const likeRef = doc(firestore, `videos/${videoId}/likes`, userProfile.id);
      const videoRef = doc(firestore, 'videos', videoId);
      try {
        const likeSnap = await getDoc(likeRef);
        if(likeSnap.exists()) {
            toast({title: "You've already liked this video."});
            return;
        }
        await runTransaction(firestore, async (transaction) => {
            transaction.set(likeRef, { likedAt: serverTimestamp() });
            transaction.update(videoRef, { likes: increment(1) });
        });
        setVideo(v => v ? {...v, likes: v.likes + 1} : null);
        toast({ title: "Liked!", description: "Thanks for your feedback." });
      } catch (err) {
        toast({ title: "Error", description: "Could not process like.", variant: "destructive" });
      }
  }

  if (isLoading) return <LoadingSkeleton />;
  if (!video) return null; // This case should ideally be handled by the loading skeleton or error boundary

  const postedDate = video.createdAt ? formatDistanceToNow(video.createdAt.toDate(), { addSuffix: true }) : '...';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-0 sm:p-4">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Video Player */}
        <div className="aspect-video w-full mb-4 bg-black rounded-xl overflow-hidden shadow-lg">
          <video
            className="w-full h-full"
            src={video.videoUrl}
            controls
            autoPlay
            poster={video.thumbnailUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Video Info */}
        <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={video.creatorAvatarUrl} alt={video.creatorName} data-ai-hint="channel avatar"/>
              <AvatarFallback>{video.creatorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{video.creatorName}</p>
              <p className="text-sm text-muted-foreground">1.2M subscribers</p>
            </div>
            <Button variant="secondary" className="ml-4 rounded-full">
              <Bell className="mr-2 h-4 w-4"/>
              Subscribed
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="rounded-full" onClick={handleLike}>
              <ThumbsUp className="mr-2 h-4 w-4" /> {video.likes.toLocaleString()}
            </Button>
            <Button variant="secondary" className="rounded-full">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <Card className="bg-muted/60 p-4 rounded-xl mb-6">
          <CardContent className="p-0">
            <p className="font-semibold text-sm mb-1">{video.views.toLocaleString()} views &bull; {postedDate}</p>
            <p className="text-sm whitespace-pre-line">{video.description}</p>
          </CardContent>
        </Card>
        
        <Separator className="my-6"/>

        {/* Comments Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">{comments.length} Comments</h2>
          {isLoggedIn && userProfile && (
            <div className="flex items-start gap-3 mb-6">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="commenter avatar" />
                    <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                    <Textarea 
                        placeholder="Add a comment..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="mb-2"
                        rows={1}
                    />
                    <div className="flex justify-end">
                        <Button onClick={handlePostComment} disabled={isSubmittingComment || !newComment.trim()}>
                            {isSubmittingComment ? "Posting..." : <><Send className="mr-2 h-4 w-4"/>Comment</>}
                        </Button>
                    </div>
                </div>
            </div>
          )}
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.authorAvatarUrl} alt={comment.authorName} data-ai-hint="commenter avatar" />
                  <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground">{comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}</p>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Videos */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold lg:hidden">Up Next</h2>
        {recommended.map(recVideo => (
          <Link href={`/chat/youtube/${recVideo.id}`} key={recVideo.id}>
            <div className="flex gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer">
              <div className="w-40 flex-shrink-0">
                <Image
                  src={recVideo.thumbnailUrl}
                  alt={recVideo.title}
                  width={160}
                  height={90}
                  className="rounded-lg object-cover aspect-video"
                  data-ai-hint="video thumbnail"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight line-clamp-2">{recVideo.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{recVideo.creatorName}</p>
                <p className="text-xs text-muted-foreground">{recVideo.views.toLocaleString()} views</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-0 sm:p-4">
      <div className="lg:col-span-2">
        <Skeleton className="aspect-video w-full mb-4 rounded-xl" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24 rounded-full" />
                <Skeleton className="h-10 w-24 rounded-full" />
            </div>
        </div>
        <Card className="bg-muted/60 p-4 rounded-xl mb-6">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-2" />
        </Card>
        <Separator className="my-6"/>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
            {Array.from({length: 3}).map((_,i) => (
                <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({length: 5}).map((_,i) => (
             <div key={i} className="flex gap-3 p-2 rounded-lg">
              <Skeleton className="w-40 h-[90px] rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
        ))}
      </div>
    </div>
  )
}
