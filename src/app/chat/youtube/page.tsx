
"use client";
import { useState, useEffect } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { Video } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

function VideoCard({ video }: { video: Video }) {
  const timeAgo = video.createdAt ? formatDistanceToNow(video.createdAt.toDate(), { addSuffix: true }) : '...';
  
  return (
    <Link href={`/chat/youtube/${video.id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
        <div className="aspect-video relative">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            data-ai-hint="video thumbnail"
          />
        </div>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Image
              src={video.creatorAvatarUrl}
              alt={video.creatorName}
              width={36}
              height={36}
              className="rounded-full mt-1"
              data-ai-hint="creator avatar"
            />
            <div>
              <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary">
                {video.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{video.creatorName}</p>
              <p className="text-sm text-muted-foreground">
                {video.views.toLocaleString()} views &bull; {timeAgo}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function VideoSkeleton() {
  return (
    <div className="block">
      <Skeleton className="aspect-video w-full" />
      <div className="p-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-full mt-1" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}


export default function YouTubeGalleryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const videosCollection = collection(firestore, 'videos');
        const q = query(videosCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedVideos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
        setVideos(fetchedVideos);
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError("Could not load videos. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (error) {
    return <div className="text-center text-destructive">{error}</div>;
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-4">
      <h1 className="text-3xl font-bold mb-6">Explore Videos</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => <VideoSkeleton key={i} />)}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <h2 className="text-xl">No Videos Yet</h2>
          <p>Check back later or ask a creator to upload something!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {videos.map(video => <VideoCard key={video.id} video={video} />)}
        </div>
      )}
    </div>
  );
}
