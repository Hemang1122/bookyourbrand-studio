'use server';
/**
 * @fileOverview An AI flow for generating a daily activity report.
 *
 * - generateActivityReport - A function that takes a date and all project data to generate a summary report.
 * - GenerateActivityReportInput - The input type for the generateActivityReport function.
 * - GenerateActivityReportOutput - The return type for the generateActivityReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Project, Task, User, ChatMessage } from '@/lib/types';
import { isSameDay, parseISO } from 'date-fns';

// Define the detailed input schema for the flow
const GenerateActivityReportInputSchema = z.object({
  date: z.string().describe('The date for which to generate the report, in YYYY-MM-DD format.'),
  projects: z.array(z.any()).describe('An array of all project objects.'),
  tasks: z.array(z.any()).describe('An array of all task objects.'),
  users: z.array(z.any()).describe('An array of all user objects.'),
  messages: z.array(z.any()).describe('An array of all chat message objects.'),
});
export type GenerateActivityReportInput = z.infer<typeof GenerateActivityReportInputSchema>;

// Define the output schema for the flow
const GenerateActivityReportOutputSchema = z.object({
  report: z.string().describe('A comprehensive summary of all activities on the given date, formatted in Markdown.'),
});
export type GenerateActivityReportOutput = z.infer<typeof GenerateActivityReportOutputSchema>;


// The main exported function that will be called from the frontend
export async function generateActivityReport(input: GenerateActivityReportInput): Promise<GenerateActivityReportOutput> {
  return generateActivityReportFlow(input);
}


// Define the prompt for the AI model
const generateActivityReportPrompt = ai.definePrompt({
  name: 'generateActivityReportPrompt',
  input: { schema: GenerateActivityReportInputSchema },
  output: { schema: GenerateActivityReportOutputSchema },
  prompt: `You are an expert project management assistant. Your task is to generate a daily activity summary for a creative agency.
  The date for this report is {{date}}.

  You will be provided with JSON data for all projects, tasks, users, and chat messages.
  Analyze the provided data and generate a concise, well-structured report in Markdown format.

  The report should include the following sections if there is relevant activity:
  1.  **Project Updates**: List any new projects created on the report date or projects whose status changed.
  2.  **Task Updates**: List new tasks created and tasks that were updated (e.g., moved to 'In Progress', 'Completed'). Mention who made the update.
  3.  **Chat Activity**: Summarize key conversations. List each message with its sender and timestamp.
  4.  **Team Activity**: Summarize which team members were active based on task updates and messages sent.

  If no significant activity occurred on the given day, state that "No significant activity was recorded for this day."

  Here is the data:
  - Projects: {{{json projects}}}
  - Tasks: {{{json tasks}}}
  - Users: {{{json users}}}
  - Messages: {{{json messages}}}

  Please generate the report now.
  `,
});


// Define the Genkit flow that orchestrates the AI call
const generateActivityReportFlow = ai.defineFlow(
  {
    name: 'generateActivityReportFlow',
    inputSchema: GenerateActivityReportInputSchema,
    outputSchema: GenerateActivityReportOutputSchema,
  },
  async (input) => {
    const reportDate = parseISO(input.date);

    const relevantTasks = input.tasks.filter(task => {
        const anyRemarkOnDate = (task as Task).remarks?.some(remark => isSameDay(parseISO(remark.timestamp), reportDate));
        // Assuming tasks have a `createdAt` field, which we'll simulate with `dueDate` for now
        const createdOnDate = isSameDay(parseISO((task as Task).dueDate), reportDate); 
        return anyRemarkOnDate || createdOnDate;
    });

    const relevantMessages = input.messages.filter(msg => {
        const msgTimestamp = (msg as ChatMessage).timestamp;
        if (!msgTimestamp || !msgTimestamp.toDate) return false;
        return isSameDay(msgTimestamp.toDate(), reportDate);
    });
    
    // In a real app, projects would have `createdAt` and `updatedAt`. We'll just pass them all.
    const relevantProjects = input.projects;

    if (relevantTasks.length === 0 && relevantMessages.length === 0) {
        return { report: "No significant activity was recorded for this day." };
    }

    const { output } = await generateActivityReportPrompt({ 
        ...input, 
        tasks: relevantTasks,
        messages: relevantMessages,
        projects: relevantProjects,
    });
    return output!;
  }
);
