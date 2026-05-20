import { z } from 'zod';

// Define the schema for a single keyword
export const KeywordSchema = z.object({
  word: z.string().describe('The keyword or key phrase'),
  blockId: z.string().describe('The block ID where this keyword appears')
});

// Define the schema for the complete keyword set that matches streaming format
export const keywordSetSchema = z.object({
  id: z.string().describe('Unique identifier for this keyword set'),
  sectionId: z.string().describe('ID of the learning section this keyword set belongs to'),
  keywords: z.array(KeywordSchema).describe('Array of keywords found in the subtask paragraphs')
});

export type KeywordSetType = z.infer<typeof keywordSetSchema>;
export type KeywordType = z.infer<typeof KeywordSchema>;
