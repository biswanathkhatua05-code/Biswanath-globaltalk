"use client";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/app-logo";
import { useAuth } from "@/context/auth-context";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WelcomePage() {
  const { loginAnonymously, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/chat');
    }
  }, [isLoggedIn, router]);

  const handleStartConnecting = () => {
    loginAnonymously();
  };

  if (isLoggedIn) {
    // Render nothing or a loading indicator while redirecting
    return <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <p className="text-foreground">Redirecting...</p>
    </div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-8 text-center">
      <div className="mb-12">
        <AppLogo showText={true} />
      </div>
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
        Welcome to GlobaTalk Lite
      </h1>
      <p className="mb-10 text-lg text-muted-foreground sm:text-xl max-w-2xl">
        Connect with people around the world. Start chatting anonymously or explore global conversations.
      </p>
      <Button 
        size="lg" 
        className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-primary/30 transition-shadow duration-300"
        onClick={handleStartConnecting}
      >
        <LogIn className="mr-2 h-5 w-5" />
        Start Connecting Anonymously
      </Button>
      <p className="mt-12 text-sm text-muted-foreground">
        By connecting, you agree to our community guidelines.
      </p>
    </div>
  );
}
