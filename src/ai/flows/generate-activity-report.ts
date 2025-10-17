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
import type { Project, Task, User } from '@/lib/types';

// Define the detailed input schema for the flow
const GenerateActivityReportInputSchema = z.object({
  date: z.string().describe('The date for which to generate the report, in YYYY-MM-DD format.'),
  projects: z.array(z.any()).describe('An array of all project objects.'),
  tasks: z.array(z.any()).describe('An array of all task objects.'),
  users: z.array(z.any()).describe('An array of all user objects.'),
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

  You will be provided with JSON data for all projects, tasks, and users.
  Analyze the provided data and generate a concise, well-structured report in Markdown format.

  The report should include the following sections:
  1.  **Tasks Completed**: List all tasks that were marked as 'Completed' on the report date. Include the task title, the project it belongs to, and the team member who completed it.
  2.  **New Tasks Created**: List any new tasks that were created on the report date.
  3.  **Project Updates**: Mention any changes in project statuses (e.g., moved to 'In Progress', 'Completed', 'On Hold').
  4.  **Team Activity**: Summarize which team members were active based on task completions.

  If no significant activity occurred on the given day, state that "No significant activity was recorded for this day."

  Here is the data:
  - Projects: {{{json projects}}}
  - Tasks: {{{json tasks}}}
  - Users: {{{json users}}}

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
    // For the purpose of this prompt, we're assuming task completion/creation dates can be inferred from the data.
    // In a real app, tasks would have `createdAt` and `completedAt` timestamps.
    // We will filter tasks based on the `dueDate` for demonstration.
    const reportDate = new Date(input.date);

    const relevantTasks = input.tasks.filter(task => {
        const taskDate = new Date((task as Task).dueDate);
        return taskDate.getFullYear() === reportDate.getFullYear() &&
               taskDate.getMonth() === reportDate.getMonth() &&
               taskDate.getDate() === reportDate.getDate();
    });
    
    if (relevantTasks.length === 0) {
        return { report: "No significant activity was recorded for this day." };
    }

    const { output } = await generateActivityReportPrompt({ ...input, tasks: relevantTasks });
    return output!;
  }
);
