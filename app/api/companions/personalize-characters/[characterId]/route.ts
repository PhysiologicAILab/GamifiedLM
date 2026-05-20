import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { GeneratedCharacter, CharacterCustomization } from '@/app/components/types';
import { generateGreeting, generateSystemPrompt } from '@/app/lib/character-config';

// Update existing character
export async function PUT(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const { characterId } = params;
    const updates: Partial<CharacterCustomization> = await request.json();
    
    // Find the character
    const charactersDir = path.join(process.cwd(), 'data', 'characters');
    const characterPath = path.join(charactersDir, characterId, 'character.json');
    
    if (!fs.existsSync(characterPath)) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Read existing character
    const existingData = fs.readFileSync(characterPath, 'utf8');
    const existingCharacter: GeneratedCharacter = JSON.parse(existingData);
    
    // Update character data
    const updatedCharacter: GeneratedCharacter = {
      ...existingCharacter,
      ...updates,
      lastUsed: new Date().toISOString()
    };
    
    // If name, personality, or identity changed, regenerate greeting and system prompt
    if (updates.name || updates.personality || updates.identity) {
      if (updates.name) updatedCharacter.name = updates.name;
      if (updates.personality) updatedCharacter.personality = updates.personality;
      if (updates.identity) updatedCharacter.identity = updates.identity;
      
      updatedCharacter.greeting = generateGreeting(
        updatedCharacter.name,
        updatedCharacter.personality.trait,
        updatedCharacter.identity.name
      );
      
      updatedCharacter.systemPrompt = generateSystemPrompt({
        name: updatedCharacter.name,
        personality: updatedCharacter.personality,
        guidingStyle: updatedCharacter.guidingStyle,
        identity: updatedCharacter.identity,
        additionalTraits: updatedCharacter.additionalTraits
      });
    }
    
    // If significant changes were made, optionally regenerate avatar
    if (updates.personality || updates.identity || updates.additionalTraits) {
      try {
        const avatarResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/companions/${characterId}/avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: updatedCharacter.name,
            personality: updatedCharacter.personality,
            identity: updatedCharacter.identity,
            additionalTraits: updatedCharacter.additionalTraits
          }),
        });
        
        if (avatarResponse.ok) {
          const result = await avatarResponse.json();
          updatedCharacter.avatarPath = result.avatarPath;
          console.log('Avatar regenerated for updated character:', characterId);
        }
      } catch (error) {
        console.error('Error regenerating avatar for updated character:', error);
        // Continue without regenerating avatar
      }
    }
    
    // Save updated character
    fs.writeFileSync(characterPath, JSON.stringify(updatedCharacter, null, 2), 'utf8');
    
    return NextResponse.json({
      success: true,
      character: updatedCharacter
    });
    
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

// Delete character
export async function DELETE(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const { characterId } = params;
    
    const charactersDir = path.join(process.cwd(), 'data', 'characters');
    const characterDir = path.join(charactersDir, characterId);
    
    if (!fs.existsSync(characterDir)) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Remove character directory and all its contents
    fs.rmSync(characterDir, { recursive: true, force: true });
    
    return NextResponse.json({
      success: true,
      message: 'Character deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}
