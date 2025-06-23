
"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const { userProfile, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3">Verifying creator status...</p>
      </div>
    );
  }

  if (!userProfile?.isCreator) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="items-center">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription>
              Only verified creators are allowed to upload videos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              If you believe you should have creator access, please contact support.
            </p>
            <Link href="/chat" passHref>
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="items-center">
          <UploadCloud className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">Upload Your Video</CardTitle>
          <CardDescription>
            This feature is coming soon! Get ready to share your content with the world.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 border-2 border-dashed border-muted-foreground/50 rounded-lg">
            <p className="text-muted-foreground">
              The video upload form and processing logic will be implemented here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
