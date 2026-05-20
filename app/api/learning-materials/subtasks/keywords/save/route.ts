import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { materialName, sectionId, keywordSet } = await request.json();

    if (!materialName || !sectionId || !keywordSet) {
      return NextResponse.json({ 
        error: 'Material name, section ID, and keyword set are required' 
      }, { status: 400 });
    }

    // Create subtask directory structure: data/learning-materials/[learning-material-id]/[subtask-id]/
    const subTaskDir = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId);
    try {
      await fs.mkdir(subTaskDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
    }

    // Save the generated keyword set to the file structure
    const keywordsPath = path.join(subTaskDir, 'keywords.json');
    await fs.writeFile(keywordsPath, JSON.stringify(keywordSet, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: `Keyword set with ${keywordSet.keywords.length} important terms saved for section "${sectionId}". Keywords focus on essential vocabulary and concepts for effective learning.` 
    });

  } catch (error) {
    console.error('Error saving keyword set:', error);
    return NextResponse.json({ 
      error: 'Failed to save keyword set',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
