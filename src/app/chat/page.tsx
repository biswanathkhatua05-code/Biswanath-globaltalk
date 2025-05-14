import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shuffle, Users, Search, MessageSquareMore } from "lucide-react";

export default function ChatDashboardPage() {
  const features = [
    {
      title: "Random Chat",
      description: "Connect with a random stranger for a one-on-one conversation.",
      href: "/chat/random",
      icon: Shuffle,
      cta: "Find Partner"
    },
    {
      title: "Global Messages",
      description: "Join the public chatroom and talk with users from all over.",
      href: "/chat/global",
      icon: Users,
      cta: "Enter Global Chat"
    },
    {
      title: "Find Friends",
      description: "Search for specific users by their UID and start a private chat.",
      href: "/chat/find",
      icon: Search,
      cta: "Search Friends"
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <MessageSquareMore className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Welcome to GlobaTalk Lite</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Choose how you want to connect and start chatting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <feature.icon className="h-10 w-10 text-primary mb-3" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription className="h-12">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              <Link href={feature.href} passHref>
                <Button className="w-full mt-4">
                  {feature.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
