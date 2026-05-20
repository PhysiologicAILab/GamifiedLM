import { z } from 'zod';

// Define the schema for a single exercise question
export const ExerciseQuestionSchema = z.object({
  id: z.string().describe('Unique identifier for the question'),
  question: z.string().describe('The question text'),
  options: z.array(z.string()).describe('Answer options for the multiple choice question'),
  correctAnswerIndex: z.number().min(0).describe('The index (0-based) of the correct answer in the options array'),
  relatedBlockIds: z.array(z.string()).describe('Block IDs from the content that this question relates to')
});

// Define the schema for the complete exercise set that matches streaming format
export const exerciseSetSchema = z.object({
  id: z.string().describe('Unique identifier for this exercise set'),
  sectionId: z.string().describe('ID of the learning section this exercise set belongs to'),
  questions: z.array(ExerciseQuestionSchema).describe('Array of exercise questions'),
  hasBackgroundImage: z.boolean().optional().describe('Whether this exercise set has a battle-themed background image')
});

export type ExerciseSetType = z.infer<typeof exerciseSetSchema>;
export type ExerciseQuestionType = z.infer<typeof ExerciseQuestionSchema>;
