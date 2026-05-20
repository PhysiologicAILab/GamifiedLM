import { experimental_generateImage as generateImage } from 'ai';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// POST endpoint to generate a new image for a narrative
export async function POST(request: NextRequest) {
  try {
    const { materialName, sectionId, keyword, narrative } = await request.json();

    if (!materialName || !sectionId || !keyword || !narrative) {
      return NextResponse.json({ 
        error: 'Material name, section ID, keyword, and narrative are required' 
      }, { status: 400 });
    }

    // First, use GPT-4o-mini to generate a better image prompt
    const { text: enhancedPrompt } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `
        You are an expert at creating prompts for AI image generation. Your task is to create a detailed, artistic prompt for generating a decorative illustration that will accompany an educational narrative.

        Context Information:
        - Keyword: ${keyword}
        - Section: ${sectionId}
        - Narrative Story: ${narrative.story}
        - Narrative Explanation: ${narrative.explanation}

        Create a detailed image generation prompt that:
        1. Describes a beautiful, decorative scene that visually represents the concept
        2. Uses artistic, aesthetic language suitable for creating engaging illustrations
        3. Focuses on visual metaphors and symbolic elements rather than literal representations
        4. Specifies an anime/illustration art style with vibrant colors
        5. Emphasizes that NO TEXT should appear in the image
        6. Creates an atmospheric, decorative scene suitable for educational content

        Requirements:
        - The scene should be visually appealing and decorative
        - Should evoke the feeling and concept of the keyword without being too literal
        - Use rich, descriptive language about colors, lighting, composition
        - Specify artistic style (anime/illustration style)
        - Mention that it should be suitable as a decorative educational illustration
        - Absolutely no text or words in the image

        Return ONLY the image generation prompt, nothing else.
      `
    });

    console.log('Enhanced image prompt generated:', enhancedPrompt);

    // Generate the image using the enhanced prompt
    const { image } = await generateImage({
      model: openai.image('dall-e-3'),
      prompt: enhancedPrompt,
      size: '1792x1024',
      providerOptions: {
        openai: { style: 'natural', quality: 'standard' }
      }
    });

    // Create narrative directory structure: data/learning-materials/[material-id]/[subtask-id]/narratives/[keyword]/
    const narrativeDir = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId, 'narratives', keyword.toLowerCase().replace(/\s+/g, '-'));
    await fs.mkdir(narrativeDir, { recursive: true });

    // Save image
    const imageFileName = 'illustration.png';
    const imagePath = path.join(narrativeDir, imageFileName);
    const imageBuffer = Buffer.from(image.base64, 'base64');
    await fs.writeFile(imagePath, imageBuffer);
    
    console.log('Enhanced narrative illustration generated for keyword:', keyword);

    return NextResponse.json({ 
      success: true,
      imagePath: `/api/learning-materials/subtasks/narratives/image?materialName=${materialName}&sectionId=${sectionId}&keyword=${encodeURIComponent(keyword)}`,
      enhancedPrompt,
      message: `Decorative illustration created for keyword "${keyword}" using enhanced prompting.`
    });

  } catch (error) {
    console.error('Error generating narrative image:', error);
    return NextResponse.json({ 
      error: 'Failed to generate narrative image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to serve existing images
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

    // Path to image file: data/learning-materials/[material-id]/[subtask-id]/narratives/[keyword]/illustration.png
    const narrativeDir = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId, 'narratives', keyword.toLowerCase().replace(/\s+/g, '-'));
    const imagePath = path.join(narrativeDir, 'illustration.png');
    
    try {
      const imageBuffer = await fs.readFile(imagePath);
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (error) {
      return NextResponse.json({ 
        error: `Image not found for keyword "${keyword}" in section "${sectionId}" of material "${materialName}"` 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error serving narrative image:', error);
    return NextResponse.json({ 
      error: 'Failed to serve narrative image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}