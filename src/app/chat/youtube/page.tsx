import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sampleVideo = {
  id: "dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
  title: "Exploring the Wonders of the Cosmos",
  channelName: "CosmoQuest",
  subscribers: "1.2M",
  views: "2,458,901",
  postedDate: "3 weeks ago",
  likes: "150K",
  description: "Join us on an epic journey through space and time as we explore distant galaxies, mysterious nebulae, and the secrets of our universe. This documentary brings the cosmos closer than ever before with stunning visuals and expert commentary.",
  channelAvatar: "https://api.dicebear.com/8.x/bottts/svg?seed=cosmoquest"
};

const recommendedVideos = [
  { id: 1, title: "The Secrets of Deep Ocean Life", channel: "AquaVerse", views: "1.1M", thumbnail: "https://placehold.co/320x180/000000/FFFFFF", hint: "ocean life" },
  { id: 2, title: "Building a Modern UI with Next.js", channel: "CodeStream", views: "540K", thumbnail: "https://placehold.co/320x180/000000/FFFFFF", hint: "code computer" },
  { id: 3, title: "Ultimate Guide to Landscape Photography", channel: "PixelPerfect", views: "890K", thumbnail: "https://placehold.co/320x180/000000/FFFFFF", hint: "landscape photography" },
  { id: 4, title: "The Physics of Black Holes Explained", channel: "AstroLeap", views: "3.2M", thumbnail: "https://placehold.co/320x180/000000/FFFFFF", hint: "black hole" },
  { id: 5, title: "How AI is Changing Our World", channel: "TechForward", views: "780K", thumbnail: "https://placehold.co/320x180/000000/FFFFFF", hint: "artificial intelligence" },
];

const comments = [
    { id: 1, author: "AstroFan22", avatar: "https://api.dicebear.com/8.x/pixel-art/svg?seed=AstroFan22", text: "Absolutely breathtaking visuals! I felt like I was traveling through space myself. Amazing work!" },
    { id: 2, author: "CuriousMind", avatar: "https://api.dicebear.com/8.x/pixel-art/svg?seed=CuriousMind", text: "This is the best documentary I've seen on the cosmos. So much information packed in an understandable way." },
    { id: 3, author: "RocketGirl", avatar: "https://api.dicebear.com/8.x/pixel-art/svg?seed=RocketGirl", text: "Can you do a video on wormholes next? Would love to hear your take on it!" },
];


export default function YouTubePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-0 sm:p-4">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Video Player */}
        <div className="aspect-video w-full mb-4">
          <iframe
            className="w-full h-full rounded-xl shadow-lg"
            src={`https://www.youtube.com/embed/${sampleVideo.id}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* Video Info */}
        <h1 className="text-2xl font-bold mb-2">{sampleVideo.title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={sampleVideo.channelAvatar} alt={sampleVideo.channelName} data-ai-hint="channel avatar"/>
              <AvatarFallback>{sampleVideo.channelName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{sampleVideo.channelName}</p>
              <p className="text-sm text-muted-foreground">{sampleVideo.subscribers} subscribers</p>
            </div>
            <Button variant="secondary" className="ml-4 rounded-full">
              <Bell className="mr-2 h-4 w-4"/>
              Subscribed
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="rounded-full">
              <ThumbsUp className="mr-2 h-4 w-4" /> {sampleVideo.likes}
            </Button>
            <Button variant="secondary" className="rounded-full">
              <ThumbsDown className="h-4 w-4" />
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
            <p className="font-semibold text-sm mb-1">{sampleVideo.views} views &bull; {sampleVideo.postedDate}</p>
            <p className="text-sm whitespace-pre-line">{sampleVideo.description}</p>
          </CardContent>
        </Card>
        
        <Separator className="my-6"/>

        {/* Comments Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">{comments.length} Comments</h2>
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.avatar} alt={comment.author} data-ai-hint="commenter avatar" />
                  <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{comment.author}</p>
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
        {recommendedVideos.map(video => (
          <Link href="#" key={video.id}>
            <div className="flex gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer">
              <div className="w-40 flex-shrink-0">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={160}
                  height={90}
                  className="rounded-lg object-cover aspect-video"
                  data-ai-hint={video.hint}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight line-clamp-2">{video.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{video.channel}</p>
                <p className="text-xs text-muted-foreground">{video.views} views</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
