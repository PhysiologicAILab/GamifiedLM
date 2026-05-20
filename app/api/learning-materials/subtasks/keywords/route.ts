import { generateObject, streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { keywordSetSchema } from './schema';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { materialName, sectionId, currentSection } = await request.json();

    if (!materialName || !sectionId || !currentSection) {
      return NextResponse.json({ 
        error: 'Material name, section ID, and current section data are required' 
      }, { status: 400 });
    }

    // Read the organized content to get the specific blocks for this section
    const organizedContentPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, 'organized-content.json');
    
    let organizedContent: any;
    
    try {
      const organizedContentData = await fs.readFile(organizedContentPath, 'utf-8');
      organizedContent = JSON.parse(organizedContentData);
    } catch (error) {
      return NextResponse.json({ 
        error: `Organized learning material "${materialName}" not found. Please ensure the content has been processed first.` 
      }, { status: 404 });
    }

    // Filter blocks that belong to the current section and are paragraphs only
    const sectionBlocks = organizedContent.blocks.filter((block: any) => 
      currentSection.blockIds.includes(block.id) && 
      (block.id.includes('-paragraph-') || block.id.includes('abstract-paragraph-'))
    );

    if (sectionBlocks.length === 0) {
      return NextResponse.json({ 
        error: `No paragraph blocks found for section "${sectionId}"` 
      }, { status: 404 });
    }

    // Generate the keyword set using AI SDK streaming
    const result = streamObject({
      model: openai('gpt-4o'),
      schema: keywordSetSchema,
      prompt: `
        Identify and extract 3 to 7 most important keywords or key phrases (adjust based on content density) from the paragraph content in this learning subtask. Focus on terms that are essential for understanding the core concepts and would be valuable for learners to recognize and understand.

        Subtask Information:
        - Title: ${currentSection.title}
        - Description: ${currentSection.description}

        Paragraph Content Blocks:
        ${JSON.stringify(sectionBlocks, null, 2)}

        KEYWORD EXTRACTION REQUIREMENTS:

        BLOCK IDENTIFICATION: For each keyword:
           - Provide the exact blockId where the keyword appears
           - If a keyword appears in multiple blocks, choose the most contextually important occurrence
           - Ensure the keyword actually exists in the specified block's content

        COMPREHENSIVE COVERAGE: Ensure keywords represent:
           - The main concepts and themes of the section
           - Technical vocabulary learners need to master
           - Important distinctions and relationships between concepts
           - Key methodological or theoretical approaches discussed

        VALIDATION REQUIREMENTS:
        - Each keyword must actually appear in the provided paragraph content
        - BlockId must be accurate and correspond to where the keyword is found
        - Keywords should collectively cover the essential vocabulary of the section
        
        OUTPUT REQUIREMENTS:
        - Set id to "${sectionId}-keywords"
        - Set sectionId to "${sectionId}"
        - Provide keywords array with word and blockId for each keyword
      `,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error generating keyword set:', error);
    return NextResponse.json({ 
      error: 'Failed to generate keyword set',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve existing keyword set
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialName = searchParams.get('materialName');
    const sectionId = searchParams.get('sectionId');

    if (!materialName || !sectionId) {
      return NextResponse.json({ 
        error: 'Material name and section ID are required' 
      }, { status: 400 });
    }

    // Path to keywords file: data/learning-materials/[learning-material-id]/[subtask-id]/keywords.json
    const keywordsPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId, 'keywords.json');
    
    try {
      const keywordsContent = await fs.readFile(keywordsPath, 'utf-8');
      const keywordSet = JSON.parse(keywordsContent);
      return NextResponse.json({ keywordSet });
    } catch (error) {
      return NextResponse.json({ 
        error: `Keyword set not found for section "${sectionId}" in material "${materialName}"` 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error retrieving keyword set:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve keyword set',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
