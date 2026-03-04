import { config } from 'dotenv';
config();

/**
 * @fileOverview Development entry point for Genkit flows.
 * This file is intended to be run in a Node.js environment via 'npm run genkit:dev'.
 */

import '@/ai/flows/ai-powered-task-summarization.ts';
import '@/ai/flows/generate-activity-report.ts';
