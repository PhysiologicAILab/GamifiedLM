import { generateObject, streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { LearningRoadmapSchema } from './schema';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { materialName } = await request.json();

    if (!materialName) {
      return NextResponse.json({ error: 'Material name is required' }, { status: 400 });
    }

    // Read the organized content and table of contents
    const organizedContentPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, 'organized-content.json');
    const tocPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, 'toc.json');
    
    let organizedContent: any;
    let tableOfContents: any;
    
    try {
      // Read organized content and TOC
      const organizedContentData = await fs.readFile(organizedContentPath, 'utf-8');
      organizedContent = JSON.parse(organizedContentData);
      
      const tocData = await fs.readFile(tocPath, 'utf-8');
      tableOfContents = JSON.parse(tocData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('ENOENT')) {
        return NextResponse.json({ 
          error: `Learning material "${materialName}" not found or not processed. Please ensure the content has been processed by calling the main learning-materials endpoint first.` 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: `Failed to read learning material data for "${materialName}": ${errorMessage}` 
      }, { status: 500 });
    }

    // Generate the learning roadmap using AI SDK streaming
    const result = streamObject({
      model: openai('o3-mini'),
      schema: LearningRoadmapSchema,
      prompt: `
        Analyze the following organized learning material and create a comprehensive learning roadmap that breaks it down into logical, sequential learning subtasks.

        Available Content Blocks:
        ${JSON.stringify(organizedContent.blocks, null, 2)}

        Block IDs Reference:
        ${JSON.stringify(tableOfContents.blockIds, null, 2)}

        Instructions:
        1. Create 5-8 learning subtasks that follow a logical progression from basic concepts to advanced topics
        2. Each subtask should be self-contained but build upon previous subtasks
        3. For each subtask, specify which block IDs from the content should be included using the "blockIds" array
        4. IMPORTANT: Use sequential IDs in the format "subtask-1", "subtask-2", "subtask-3", etc. for each subtask
        5. Estimate realistic time requirements based on the approximate word count of included content blocks:
           - Count approximate words in all content blocks for each subtask
           - Use these reading speeds: 200-250 words per minute for dense academic text, 300-400 words per minute for lighter content
           - Add 20-30% extra time for comprehension, note-taking, and reflection
           - Typical subtasks should be 5-15 minutes, avoid subtasks longer than 20 minutes
           - For very short subtasks (under 500 words), minimum 3-4 minutes to account for context switching
        6. Create engaging, descriptive titles that motivate learning and reflect the content blocks
        7. Write clear descriptions that explain what learners will gain from each subtask
        8. Ensure the roadmap provides a complete learning journey through all the material
        9. Make sure all block IDs are distributed across subtasks - don't leave any blocks unused
        10. Group related blocks together logically (e.g., headings with their content, related paragraphs)

        The roadmap should be structured as a gamified learning adventure, where each subtask represents a "quest" that builds knowledge progressively. Each subtask should contain a meaningful subset of the content blocks that work together to teach specific concepts or skills.
      `,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error generating learning roadmap:', error);
    return NextResponse.json({ 
      error: 'Failed to generate learning roadmap',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve existing roadmap
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialName = searchParams.get('materialName');

    if (!materialName) {
      return NextResponse.json({ error: 'Material name is required' }, { status: 400 });
    }

    const roadmapPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, 'roadmap.json');
    
    try {
      const roadmapContent = await fs.readFile(roadmapPath, 'utf-8');
      const roadmap = JSON.parse(roadmapContent);
      
      // Calculate estimated total time from subtasks if not present
      if (!roadmap.estimatedTotalTime && roadmap.subtasks) {
        roadmap.estimatedTotalTime = roadmap.subtasks.reduce((total: number, subtask: any) => total + (subtask.estimatedTime || 0), 0);
      }
      
      // Backward compatibility: handle old 'sections' format
      if (!roadmap.subtasks && roadmap.sections) {
        roadmap.subtasks = roadmap.sections;
        roadmap.totalSubtasks = roadmap.totalSections || roadmap.sections.length;
        if (!roadmap.estimatedTotalTime) {
          roadmap.estimatedTotalTime = roadmap.sections.reduce((total: number, section: any) => total + (section.estimatedTime || 0), 0);
        }
      }
      
      return NextResponse.json({ roadmap });
    } catch (error) {
      return NextResponse.json({ error: `Roadmap not found for "${materialName}"` }, { status: 404 });
    }

  } catch (error) {
    console.error('Error retrieving learning roadmap:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve learning roadmap',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
