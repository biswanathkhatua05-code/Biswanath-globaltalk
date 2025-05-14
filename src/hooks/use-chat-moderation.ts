"use client";
import { useState } from 'react';
import { moderateChat } from '@/ai/flows/moderate-chat';
import type { ModerateChatInput, ModerateChatOutput } from '@/ai/flows/moderate-chat';

interface UseChatModerationReturn {
  checkMessage: (input: ModerateChatInput) => Promise<ModerateChatOutput>;
  isLoading: boolean;
  error: string | null;
}

export function useChatModeration(): UseChatModerationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMessage = async (input: ModerateChatInput): Promise<ModerateChatOutput> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await moderateChat(input);
      setIsLoading(false);
      return result;
    } catch (e) {
      setIsLoading(false);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during moderation.';
      setError(errorMessage);
      // Default to unsafe if an error occurs to be cautious
      return { isSafe: false, reason: `Moderation failed: ${errorMessage}` };
    }
  };

  return { checkMessage, isLoading, error };
}
