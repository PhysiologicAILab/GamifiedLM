import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { GeneratedCharacter, CharacterCustomization } from '@/app/components/types';
import {
  getAvatarForIdentity,
  generateGreeting,
  generateSystemPrompt,
} from '@/app/lib/character-config';

// Get all characters
export async function GET() {
  try {
    const charactersDir = path.join(process.cwd(), 'data', 'characters');
    
    // Check if characters directory exists
    if (!fs.existsSync(charactersDir)) {
      return NextResponse.json({
        success: true,
        characters: [],
        message: 'No characters directory found'
      });
    }
    
    const characterFolders = fs.readdirSync(charactersDir).filter(item => {
      const itemPath = path.join(charactersDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    if (characterFolders.length === 0) {
      return NextResponse.json({
        success: true,
        characters: [],
        message: 'No characters found'
      });
    }
    
    const characters: GeneratedCharacter[] = [];
    
    for (const folder of characterFolders) {
      const characterPath = path.join(charactersDir, folder, 'character.json');
      if (fs.existsSync(characterPath)) {
        try {
          const characterData = fs.readFileSync(characterPath, 'utf8');
          const character = JSON.parse(characterData) as GeneratedCharacter;
          characters.push(character);
        } catch (error) {
          console.error(`Error reading character from ${folder}:`, error);
        }
      }
    }
    
    // Sort by last used (most recent first), then by created date
    characters.sort((a, b) => {
      const aLastUsed = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const bLastUsed = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      
      if (aLastUsed !== bLastUsed) {
        return bLastUsed - aLastUsed; // Most recent first
      }
      
      // If no last used or same, sort by created date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return NextResponse.json({
      success: true,
      characters,
      count: characters.length
    });
    
  } catch (error) {
    console.error('Error loading characters:', error);
    return NextResponse.json(
      { error: 'Failed to load characters' },
      { status: 500 }
    );
  }
}

// Create new character
export async function POST(req: NextRequest) {
  try {
    const customization: CharacterCustomization = await req.json();
    
    // Validate required fields
    if (!customization.name || !customization.personality || !customization.guidingStyle || !customization.identity) {
      return NextResponse.json(
        { error: 'Missing required customization fields' },
        { status: 400 }
      );
    }
    
    // Validate character name and check for duplicates
    const nameValidation = validateCharacterName(customization.name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }
    
    // Generate character ID from name only
    const characterId = generateSafeId(customization.name);
    
    // Check if character with this name already exists
    const charactersDir = path.join(process.cwd(), 'data', 'characters');
    const characterDir = path.join(charactersDir, characterId);
    
    if (fs.existsSync(characterDir)) {
      return NextResponse.json(
        { error: `A character with the name "${customization.name}" already exists. Please choose a different name.` },
        { status: 409 }
      );
    }
    
    // Generate avatar using dedicated avatar endpoint
    let avatarPath: string | undefined;
    try {
      const avatarResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/companions/${characterId}/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customization),
      });
      
      if (avatarResponse.ok) {
        const result = await avatarResponse.json();
        avatarPath = result.avatarPath;
        console.log('Avatar generated via avatar endpoint:', avatarPath);
      } else {
        console.error('Failed to generate avatar via endpoint:', await avatarResponse.text());
      }
    } catch (error) {
      console.error('Error calling avatar generation endpoint:', error);
      // Continue without avatar image - will fall back to emoji
    }

    // Generate character using AI
    const character: GeneratedCharacter = {
      id: characterId,
      name: customization.name,
      avatar: getAvatarForIdentity(customization.identity.id),
      avatarPath,
      personality: customization.personality,
      guidingStyle: customization.guidingStyle,
      identity: customization.identity,
      additionalTraits: customization.additionalTraits || '',
      greeting: generateGreeting(customization.name, customization.personality.trait, customization.identity.name),
      systemPrompt: generateSystemPrompt(customization),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    // Character directory should already exist from avatar generation (reuse existing variables)
    
    // Ensure directories exist (in case avatar generation failed)
    if (!fs.existsSync(charactersDir)) {
      fs.mkdirSync(charactersDir, { recursive: true });
    }
    
    if (!fs.existsSync(characterDir)) {
      fs.mkdirSync(characterDir, { recursive: true });
    }
    
    // Save character data
    const characterPath = path.join(characterDir, 'character.json');
    fs.writeFileSync(characterPath, JSON.stringify(character, null, 2), 'utf8');
    
    console.log(`Created character "${character.name}" with ID: ${character.id}`);
    
    return NextResponse.json({
      success: true,
      character
    });
    
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}

// Helper functions
function validateCharacterName(name: string): { isValid: boolean; error?: string } {
  // Check if name is empty or only whitespace
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Character name cannot be empty' };
  }
  
  // Check name length
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Character name must be at least 2 characters long' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: 'Character name must be less than 50 characters long' };
  }
  
  // Check for valid characters (letters, numbers, spaces, hyphens, underscores, apostrophes)
  const validNamePattern = /^[a-zA-Z0-9\s\-_']+$/;
  if (!validNamePattern.test(name.trim())) {
    return { isValid: false, error: 'Character name can only contain letters, numbers, spaces, hyphens, underscores, and apostrophes' };
  }
  
  // Check that it's not just special characters
  const hasAlphanumeric = /[a-zA-Z0-9]/.test(name.trim());
  if (!hasAlphanumeric) {
    return { isValid: false, error: 'Character name must contain at least one letter or number' };
  }
  
  return { isValid: true };
}

function generateSafeId(name: string): string {
  const safeName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return safeName;
}



