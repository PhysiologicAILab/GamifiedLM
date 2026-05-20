import { NextResponse } from 'next/server';
import {
  PERSONALITY_TRAITS,
  CHARACTER_IDENTITIES,
  GUIDING_STYLES
} from '@/app/lib/character-config';

/**
 * GET /api/companions/character-config
 * Returns the available character configuration options
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        personalityTraits: PERSONALITY_TRAITS,
        characterIdentities: CHARACTER_IDENTITIES,
        guidingStyles: GUIDING_STYLES
      }
    });
  } catch (error) {
    console.error('Error fetching character configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch character configuration' 
      },
      { status: 500 }
    );
  }
}
