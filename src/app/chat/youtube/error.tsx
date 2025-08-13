// src/app/chat/youtube/error.tsx
"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center shadow-lg">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <CardTitle className="mt-4 text-2xl">Something Went Wrong</CardTitle>
                <CardDescription>
                   {`We couldn't load the video you were looking for. This might be a temporary issue.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-md text-sm text-destructive border border-dashed border-destructive/50">
                    <p><strong>Error:</strong> {error.message || "An unexpected error occurred."}</p>
                </div>
                <Button onClick={() => reset()}>
                    Try Again
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
