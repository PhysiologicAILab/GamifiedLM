import { z } from 'zod';

// Define the schema for a learning subtask
export const LearningSubtaskSchema = z.object({
  id: z.string().describe('Unique identifier for the subtask in format "subtask-1", "subtask-2", etc.'),
  title: z.string().describe('Clear, engaging title for the learning subtask'),
  description: z.string().describe('Brief description of what this subtask covers'),
  estimatedTime: z.number().describe('Estimated time in minutes to complete this subtask'),
  blockIds: z.array(z.string()).describe('Array of block IDs from the organized content that are included in this subtask')
});

// Define the schema for the complete learning roadmap
export const LearningRoadmapSchema = z.object({
  title: z.string().describe('Title of the learning roadmap'),
  description: z.string().describe('Overview description of the learning journey'),
  totalSubtasks: z.number().describe('Total number of learning subtasks'),
  subtasks: z.array(LearningSubtaskSchema).describe('Array of learning subtasks in logical order')
});

export type LearningRoadmapType = z.infer<typeof LearningRoadmapSchema>;
export type LearningSubtaskType = z.infer<typeof LearningSubtaskSchema>;

