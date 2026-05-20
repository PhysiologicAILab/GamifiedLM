import { experimental_generateImage as generateImage } from 'ai';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// POST endpoint to generate a new fantasy adventure background image for exercises
export async function POST(request: NextRequest) {
  try {
    const { materialName, sectionId } = await request.json();

    if (!materialName || !sectionId) {
      return NextResponse.json({ 
        error: 'Material name and section ID are required' 
      }, { status: 400 });
    }

    // Read the roadmap to get the subtask description
    const roadmapPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, 'roadmap.json');
    
    let roadmapData: any;
    let subtaskInfo: any;
    
    try {
      const roadmapContent = await fs.readFile(roadmapPath, 'utf-8');
      roadmapData = JSON.parse(roadmapContent);
      subtaskInfo = roadmapData.subtasks.find((subtask: any) => subtask.id === sectionId);
      
      if (!subtaskInfo) {
        return NextResponse.json({ 
          error: `Subtask "${sectionId}" not found in roadmap` 
        }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: `Roadmap not found for material "${materialName}"` 
      }, { status: 404 });
    }

    // First, use GPT-4o-mini to generate a battle-themed image prompt
    const { text: enhancedPrompt } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `
        You are an expert at creating prompts for AI image generation. Your task is to create a detailed, artistic prompt for generating a FANTASY ADVENTURE decorative background that will accompany educational exercises/challenges.

        Context Information:
        - Learning Material: ${roadmapData.title}
        - Overall Description: ${roadmapData.description}
        - Subtask Title: ${subtaskInfo.title}
        - Subtask Description: ${subtaskInfo.description}
        - Estimated Time: ${subtaskInfo.estimatedTime} minutes

        Create a detailed image generation prompt that:
        1. Describes an EPIC FANTASY ADVENTURE scene that represents the quest/challenge nature of learning
        2. Uses magical, adventurous language suitable for creating engaging fantasy illustrations
        3. Focuses on heroic quest themes, magical academies, mystical libraries, or enchanted study halls
        4. Specifies an anime/manga art style with vibrant, magical colors and mystical lighting
        5. Emphasizes that NO TEXT should appear in the image
        6. Creates an atmospheric, adventure-themed scene suitable as a background for educational challenges
        7. Should evoke feelings of excitement, discovery, determination, and magical learning

        Fantasy Adventure Theme Requirements:
        - The scene should be visually striking and adventure-oriented (heroes on quests, magical scholars, mystical academies, etc.)
        - Should evoke the feeling of embarking on an exciting learning journey or knowledge quest
        - Use rich, magical language about spells, enchanted books, glowing crystals, magical energy, floating elements
        - Specify dynamic anime/manga illustration style with mystical colors and magical lighting effects
        - Mention that it should be suitable as a decorative background for learning adventures
        - Include elements like: magical libraries, floating books, glowing runes, crystal formations, mystical academies, heroic scholars
        - Absolutely no text or words in the image
        - Should be landscape orientation suitable as a background
        - Focus on POSITIVE magical learning themes rather than conflict

        Return ONLY the image generation prompt, nothing else.
      `
    });

    console.log('Enhanced fantasy adventure background prompt generated:', enhancedPrompt);

    // Generate the image using the enhanced prompt
    const { image } = await generateImage({
      model: openai.image('dall-e-3'),
      prompt: enhancedPrompt,
      size: '1792x1024',
      providerOptions: {
        openai: { style: 'natural', quality: 'standard' }
      }
    });

    // Create exercise directory structure: data/learning-materials/[material-id]/[subtask-id]/
    const exerciseDir = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId);
    await fs.mkdir(exerciseDir, { recursive: true });

    // Save image as exercise-bg.jpg
    const imageFileName = 'exercise-bg.jpg';
    const imagePath = path.join(exerciseDir, imageFileName);
    const imageBuffer = Buffer.from(image.base64, 'base64');
    await fs.writeFile(imagePath, imageBuffer);
    
    console.log('Enhanced exercise fantasy adventure background generated for section:', sectionId);

    return NextResponse.json({ 
      success: true,
      imagePath: `/api/learning-materials/subtasks/exercises/image?materialName=${materialName}&sectionId=${sectionId}`,
      enhancedPrompt,
      message: `Fantasy adventure background created for exercise set "${sectionId}" using enhanced prompting.`
    });

  } catch (error) {
    console.error('Error generating exercise background image:', error);
    return NextResponse.json({ 
      error: 'Failed to generate exercise background image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to serve existing exercise background images
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

    // Path to image file: data/learning-materials/[material-id]/[subtask-id]/exercise-bg.jpg
    const exerciseDir = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId);
    const imagePath = path.join(exerciseDir, 'exercise-bg.jpg');
    
    try {
      const imageBuffer = await fs.readFile(imagePath);
      
      return new NextResponse(imageBuffer as any, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (error) {
      return NextResponse.json({ 
        error: `Exercise background image not found for section "${sectionId}" in material "${materialName}"` 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error serving exercise background image:', error);
    return NextResponse.json({ 
      error: 'Failed to serve exercise background image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
