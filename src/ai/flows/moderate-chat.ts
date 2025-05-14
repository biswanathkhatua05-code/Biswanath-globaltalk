// src/ai/flows/moderate-chat.ts
'use server';

/**
 * @fileOverview AI moderation for chat messages to ensure a safe and pleasant user experience.
 *
 * - moderateChat - A function that moderates chat messages.
 * - ModerateChatInput - The input type for the moderateChat function.
 * - ModerateChatOutput - The return type for the moderateChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateChatInputSchema = z.object({
  message: z.string().describe('The chat message to be moderated.'),
  userUid: z.string().describe('The UID of the user sending the message.'),
});
export type ModerateChatInput = z.infer<typeof ModerateChatInputSchema>;

const ModerateChatOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the message is safe or not.'),
  reason: z.string().describe('The reason why the message is not safe, if applicable.'),
});
export type ModerateChatOutput = z.infer<typeof ModerateChatOutputSchema>;

export async function moderateChat(input: ModerateChatInput): Promise<ModerateChatOutput> {
  return moderateChatFlow(input);
}

const moderateChatPrompt = ai.definePrompt({
  name: 'moderateChatPrompt',
  input: {schema: ModerateChatInputSchema},
  output: {schema: ModerateChatOutputSchema},
  prompt: `You are an AI moderator responsible for ensuring chat messages are appropriate and safe.

You will determine if the message is safe or not. If it is not safe, provide a reason.

Message: {{{message}}}
User UID: {{{userUid}}}`,
});

const moderateChatFlow = ai.defineFlow(
  {
    name: 'moderateChatFlow',
    inputSchema: ModerateChatInputSchema,
    outputSchema: ModerateChatOutputSchema,
  },
  async input => {
    const {output} = await moderateChatPrompt(input);
    return output!;
  }
);
