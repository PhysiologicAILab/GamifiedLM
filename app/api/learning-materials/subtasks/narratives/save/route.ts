import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { materialName, sectionId, keyword, narrative, blockId, skipImageGeneration = false } = await request.json();

    if (!materialName || !sectionId || !keyword || !narrative) {
      return NextResponse.json({ 
        error: 'Material name, section ID, keyword, and narrative are required' 
      }, { status: 400 });
    }

    // Create narrative directory structure: data/learning-materials/[material-id]/[subtask-id]/narratives/[keyword]/
    const narrativeDir = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId, 'narratives', keyword.toLowerCase().replace(/\s+/g, '-'));
    try {
      await fs.mkdir(narrativeDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
    }

    // Save the generated narrative to the file structure
    const narrativePath = path.join(narrativeDir, 'narrative.json');
    const narrativeWithMeta = {
      ...narrative,
      materialName,
      sectionId,
      blockId,
      generatedAt: new Date().toISOString(),
      hasImage: false // Will be updated when image is generated
    };
    
    await fs.writeFile(narrativePath, JSON.stringify(narrativeWithMeta, null, 2));

    // Generate an illustration using the separate image endpoint (only if not skipped)
    let imagePath: string | null = null;
    if (!skipImageGeneration) {
      try {
        const imageResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/learning-materials/subtasks/narratives/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            materialName,
            sectionId,
            keyword,
            narrative
          })
        });

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          imagePath = imageResult.imagePath;
          
          // Update the narrative file to indicate it has an image
          narrativeWithMeta.hasImage = true;
          await fs.writeFile(narrativePath, JSON.stringify(narrativeWithMeta, null, 2));
          
          console.log('Enhanced narrative illustration generated for keyword:', keyword);
        } else {
          console.warn('Failed to generate illustration via image endpoint for keyword:', keyword);
        }
      } catch (error) {
        console.warn('Failed to generate illustration for keyword:', keyword, error);
        // Continue without image - it's not critical
      }
    }

    return NextResponse.json({ 
      success: true, 
      narrative: narrativeWithMeta,
      imagePath: imagePath,
      message: `Educational narrative saved for keyword "${keyword}" with ${imagePath ? 'enhanced illustration' : 'explanation and story'}.` 
    });

  } catch (error) {
    console.error('Error saving narrative:', error);
    return NextResponse.json({ 
      error: 'Failed to save narrative',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
