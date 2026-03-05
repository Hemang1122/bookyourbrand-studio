export interface TaskTemplate {
  title: string;
  description: string;
  estimatedDays?: number;
  order: number;
}

export const PROJECT_TASK_TEMPLATES: TaskTemplate[] = [
  {
    title: "Script Writing & Concept Development",
    description: "Review client brief, develop script and storyboard for all reels in the project",
    estimatedDays: 2,
    order: 1
  },
  {
    title: "Raw Footage Collection & Review",
    description: "Collect and organize all raw footage, stock footage, and media assets from client",
    estimatedDays: 1,
    order: 2
  },
  {
    title: "Video Editing - First Cut",
    description: "Complete initial editing pass: cutting, trimming, and sequencing all reels",
    estimatedDays: 3,
    order: 3
  },
  {
    title: "Color Grading & Color Correction",
    description: "Apply color grading and correction to match brand style and ensure consistency",
    estimatedDays: 2,
    order: 4
  },
  {
    title: "Motion Graphics & Text Overlays",
    description: "Add animated text, lower thirds, transitions, and motion graphics elements",
    estimatedDays: 2,
    order: 5
  },
  {
    title: "Sound Design & Audio Mixing",
    description: "Add background music, sound effects, voiceover integration, and audio balancing",
    estimatedDays: 1,
    order: 6
  },
  {
    title: "Client Review - First Draft",
    description: "Share first complete draft with client for feedback and revision notes",
    estimatedDays: 1,
    order: 7
  },
  {
    title: "Revision & Changes Implementation",
    description: "Implement all client feedback and requested changes from review",
    estimatedDays: 2,
    order: 8
  },
  {
    title: "Final Rendering & Export",
    description: "Render final versions in all required formats and resolutions",
    estimatedDays: 1,
    order: 9
  },
  {
    title: "Quality Check & Delivery",
    description: "Final QC check and deliver files to client via preferred method",
    estimatedDays: 1,
    order: 10
  }
];

/**
 * Calculates a due date based on a start date and a number of days to add.
 * @param startDate The date to start from
 * @param daysToAdd Number of days to add
 * @returns YYYY-MM-DD string
 */
export function calculateDueDate(startDate: Date, daysToAdd: number): string {
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + daysToAdd);
  return dueDate.toISOString().split('T')[0];
}
