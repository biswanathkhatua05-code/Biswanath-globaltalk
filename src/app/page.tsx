"use client";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/app-logo";
import { useAuth } from "@/context/auth-context";
import { LogIn, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WelcomePage() {
  const { loginAnonymously, isLoggedIn, isLoadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the user is already logged in, redirect them to the chat page.
    if (isLoggedIn) {
      router.replace('/chat');
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    // This effect handles the automatic login for new users.
    // It waits until the initial auth check is complete (!isLoadingAuth).
    // If the user is not logged in, it triggers the anonymous login process.
    if (!isLoadingAuth && !isLoggedIn) {
      loginAnonymously();
    }
  }, [isLoadingAuth, isLoggedIn, loginAnonymously]);

  // While auth state is being determined or the user is being redirected,
  // show a clean loading screen. This will be visible for a short moment
  // to new users while they are being logged in and redirected.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-8 text-center">
      <div className="mb-12">
        <AppLogo showText={true} />
      </div>
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
        Connecting you to GlobaTalk...
      </h1>
      <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl">
        Please wait a moment while we set up your session.
      </p>
    </div>
  );
}
