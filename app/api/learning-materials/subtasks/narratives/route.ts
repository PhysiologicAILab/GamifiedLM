import { generateObject, streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { narrativeSchema } from './schema';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { materialName, sectionId, keyword } = await request.json();

    if (!materialName || !sectionId || !keyword) {
      return NextResponse.json({ 
        error: 'Material name, section ID, and keyword are required' 
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

    // Read the keywords file to get the keyword details
    const keywordsPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId, 'keywords.json');
    
    let keywordSet: any;
    
    try {
      const keywordsData = await fs.readFile(keywordsPath, 'utf-8');
      keywordSet = JSON.parse(keywordsData);
    } catch (error) {
      return NextResponse.json({ 
        error: `Keywords not found for section "${sectionId}" in material "${materialName}". Please generate keywords first.` 
      }, { status: 404 });
    }

    // Find the specific keyword
    const keywordData = keywordSet.keywords.find((k: any) => k.word.toLowerCase() === keyword.toLowerCase());
    if (!keywordData) {
      return NextResponse.json({ 
        error: `Keyword "${keyword}" not found in section "${sectionId}"` 
      }, { status: 404 });
    }

    // Get the block where this keyword appears
    const keywordBlock = organizedContent.blocks.find((block: any) => block.id === keywordData.blockId);
    if (!keywordBlock) {
      return NextResponse.json({ 
        error: `Block not found for keyword "${keyword}"` 
      }, { status: 404 });
    }

    // Get all blocks for this section for additional context
    const roadmapPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, 'roadmap.json');
    let currentSection: any;
    
    try {
      const roadmapData = await fs.readFile(roadmapPath, 'utf-8');
      const roadmap = JSON.parse(roadmapData);
      currentSection = roadmap.subtasks.find((section: any) => section.id === sectionId);
    } catch (error) {
      return NextResponse.json({ 
        error: `Roadmap not found for material "${materialName}"` 
      }, { status: 404 });
    }

    if (!currentSection) {
      return NextResponse.json({ 
        error: `Section "${sectionId}" not found in roadmap` 
      }, { status: 404 });
    }

    // Filter blocks that belong to the current section
    const sectionBlocks = organizedContent.blocks.filter((block: any) => 
      currentSection.blockIds.includes(block.id)
    );

    // Generate the narrative using AI SDK streaming
    const result = streamObject({
      model: openai('gpt-4o'),
      schema: narrativeSchema,
      prompt: `
        Create an engaging and educational narrative for the keyword "${keyword}" that appears in this learning content. The narrative should help learners understand the concept deeply through both explanation and storytelling.

        Section Information:
        - Title: ${currentSection.title}
        - Description: ${currentSection.description}

        Keyword Information:
        - Keyword: ${keyword}
        - Appears in Block: ${keywordBlock.id}
        - Block Content: ${keywordBlock.content}

        Full Section Context:
        ${JSON.stringify(sectionBlocks, null, 2)}

        NARRATIVE REQUIREMENTS:

        EXPLANATION COMPONENT:
           - Provide a clear, accurate explanation of the keyword in its specific context with very simple language.
           - Make it very simple and easy to understand, should not exceed 2 sentences.

        STORY COMPONENT:
           - Create an engaging, memorable story that illustrates the keyword concept
           - The story should be relatable and help learners remember the concept
           - Use analogies, metaphors, or real-world scenarios that make the concept concrete
           - Ensure the story directly relates to and reinforces the explanation
           - Make it engaging but educational (3-4 paragraphs)

        3. ACCURACY AND QUALITY:
           - Ensure all information is accurate to the source material
           - Maintain consistency with the academic/educational tone of the content
           - Don't add information not supported by the source material
           - The explanation must be accurate to the source material
           - The story must genuinely illustrate the keyword concept
           - The narrative should enhance learning, not just entertain
      `,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error generating narrative:', error);
    return NextResponse.json({ 
      error: 'Failed to generate narrative',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve existing narrative
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialName = searchParams.get('materialName');
    const sectionId = searchParams.get('sectionId');
    const keyword = searchParams.get('keyword');

    if (!materialName || !sectionId || !keyword) {
      return NextResponse.json({ 
        error: 'Material name, section ID, and keyword are required' 
      }, { status: 400 });
    }

    // Path to narrative file: data/learning-materials/[material-id]/[subtask-id]/narratives/[keyword]/narrative.json
    const narrativeDir = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId, 'narratives', keyword.toLowerCase().replace(/\s+/g, '-'));
    const narrativePath = path.join(narrativeDir, 'narrative.json');
    
    try {
      const narrativeContent = await fs.readFile(narrativePath, 'utf-8');
      const narrative = JSON.parse(narrativeContent);
      
      // Check if image exists
      const imagePath = path.join(narrativeDir, 'illustration.png');
      const hasImage = await fs.access(imagePath).then(() => true).catch(() => false);
      
      return NextResponse.json({ 
        narrative: {
          ...narrative,
          hasImage
        },
        imagePath: hasImage ? `/api/learning-materials/subtasks/narratives/image?materialName=${materialName}&sectionId=${sectionId}&keyword=${encodeURIComponent(keyword)}` : null
      });
    } catch (error) {
      return NextResponse.json({ 
        error: `Narrative not found for keyword "${keyword}" in section "${sectionId}" of material "${materialName}"` 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error retrieving narrative:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve narrative',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
