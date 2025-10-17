'use server';
/**
 * @fileOverview An AI-powered task summarization flow.
 *
 * - summarizeProjectBrief - A function that takes a project brief and returns a summary and suggested tasks.
 * - SummarizeProjectBriefInput - The input type for the summarizeProjectBrief function.
 * - SummarizeProjectBriefOutput - The return type for the summarizeProjectBrief function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProjectBriefInputSchema = z.object({
  projectBrief: z
    .string()
    .describe('A detailed project brief document provided by the customer.'),
});
export type SummarizeProjectBriefInput = z.infer<typeof SummarizeProjectBriefInputSchema>;

const SuggestedTaskSchema = z.object({
  title: z.string().describe('The title of the suggested task.'),
  description: z.string().describe('A detailed description of the task.'),
});

const SummarizeProjectBriefOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the project brief.'),
  suggestedTasks: z.array(SuggestedTaskSchema).describe('An array of suggested tasks derived from the project brief.'),
});
export type SummarizeProjectBriefOutput = z.infer<typeof SummarizeProjectBriefOutputSchema>;

export async function summarizeProjectBrief(
  input: SummarizeProjectBriefInput
): Promise<SummarizeProjectBriefOutput> {
  return summarizeProjectBriefFlow(input);
}

const summarizeProjectBriefPrompt = ai.definePrompt({
  name: 'summarizeProjectBriefPrompt',
  input: {schema: SummarizeProjectBriefInputSchema},
  output: {schema: SummarizeProjectBriefOutputSchema},
  prompt: `You are an AI assistant that helps project managers by summarizing project briefs and suggesting actionable tasks.

  Given the following project brief, provide a concise summary and a list of suggested tasks with detailed descriptions.

  Project Brief:
  {{projectBrief}}

  Respond in JSON format.
  {
    "summary": "concise summary",
    "suggestedTasks": [
      {
        "title": "Task Title",
        "description": "Detailed task description"
      }
    ]
  }`,
});

const summarizeProjectBriefFlow = ai.defineFlow(
  {
    name: 'summarizeProjectBriefFlow',
    inputSchema: SummarizeProjectBriefInputSchema,
    outputSchema: SummarizeProjectBriefOutputSchema,
  },
  async input => {
    const {output} = await summarizeProjectBriefPrompt(input);
    return output!;
  }
);
