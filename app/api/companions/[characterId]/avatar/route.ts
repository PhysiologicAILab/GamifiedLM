import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { CharacterCustomization } from '@/app/components/types';
import {
  getPersonalityVisualStyle,
  getIdentityVisualStyle,
  getAnimeArtDirection
} from '@/app/lib/character-config';

// GET: Read existing avatar
export async function GET(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const { characterId } = params;
    
    // Construct the path to the avatar image
    const avatarPath = path.join(process.cwd(), 'data', 'characters', characterId, 'avatar.png');
    
    // Check if the file exists
    if (!fs.existsSync(avatarPath)) {
      return new NextResponse('Avatar not found', { status: 404 });
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(avatarPath);
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error serving avatar:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// POST: Generate new avatar
export async function POST(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const { characterId } = params;
    const customization: CharacterCustomization = await request.json();
    
    // Validate required fields for avatar generation
    if (!customization.name || !customization.personality || !customization.identity) {
      return NextResponse.json(
        { error: 'Missing required fields for avatar generation' },
        { status: 400 }
      );
    }
    
    // Generate avatar image
    try {
      const avatarPrompt = generateAvatarPrompt(customization);
      console.log('Generating avatar with prompt:', avatarPrompt);
      
      const { image } = await generateImage({
        model: openai.image('dall-e-3'),
        prompt: avatarPrompt,
        size: '1024x1024',
        providerOptions: {
          openai: { style: 'vivid', quality: 'hd' }
        }
      });
      
      // Ensure character directory exists
      const characterDir = path.join(process.cwd(), 'data', 'characters', characterId);
      if (!fs.existsSync(characterDir)) {
        fs.mkdirSync(characterDir, { recursive: true });
      }
      
      // Save image as PNG
      const imagePath = path.join(characterDir, 'avatar.png');
      const imageBuffer = Buffer.from(image.base64, 'base64');
      fs.writeFileSync(imagePath, imageBuffer);
      
      const avatarPath = `/api/companions/${characterId}/avatar`;
      console.log('Avatar saved for character:', characterId);
      
      return NextResponse.json({
        success: true,
        avatarPath,
        message: 'Avatar generated successfully'
      });
      
    } catch (error) {
      console.error('Error generating avatar:', error);
      return NextResponse.json(
        { error: 'Failed to generate avatar' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in avatar generation endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process avatar request' },
      { status: 500 }
    );
  }
}

// Helper function for generating avatar prompts
function generateAvatarPrompt(customization: CharacterCustomization): string {
  const { name, personality, identity, additionalTraits } = customization;
  
  // Base anime-style foundation prompt
  let prompt = `Create a cute anime-style character portrait with a vibrant and colorful palette. The focus should be on the character's face, capturing their charming features. The background should be visually appealing and complement the character, but the entire image should contain no text. `;
  
  // Character context
  prompt += `This is ${name}, an AI learning companion. `;
  
  // Add personality-based visual traits using centralized config
  const personalityVisual = getPersonalityVisualStyle(personality.trait);
  prompt += `The character should have ${personalityVisual}. `;
  
  // Add identity-based styling using centralized config
  const identityStyle = getIdentityVisualStyle(identity.id);
  prompt += `Their appearance should reflect ${identityStyle}. `;
  
  // Add additional traits if any
  if (additionalTraits && additionalTraits.trim().length > 0) {
    prompt += `Additional characteristics: ${additionalTraits}. `;
  }
  
  // Add consistent anime art direction
  const artDirection = getAnimeArtDirection();
  prompt += artDirection + '. ';
  
  // Final touches for learning companion context
  prompt += 'Friendly, approachable expression that conveys warmth and intelligence, perfect for an educational AI companion.';
  
  return prompt;
}
