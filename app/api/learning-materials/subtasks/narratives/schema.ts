import { z } from 'zod';

// Define the schema for a narrative that matches the existing structure
export const narrativeSchema = z.object({
  keyword: z.string().describe('The keyword this narrative explains'),
  explanation: z.string().describe('Clear, educational explanation of the keyword in context'),
  story: z.string().describe('An engaging story that illustrates the keyword concept')
});

export type NarrativeType = z.infer<typeof narrativeSchema>;
