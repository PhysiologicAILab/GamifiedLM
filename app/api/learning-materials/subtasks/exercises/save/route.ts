import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { materialName, sectionId, exerciseSet } = await request.json();

    if (!materialName || !sectionId || !exerciseSet) {
      return NextResponse.json({ 
        error: 'Material name, section ID, and exercise set are required' 
      }, { status: 400 });
    }

    // Create subtask directory structure: data/learning-materials/[learning-material-id]/[subtask-id]/
    const subTaskDir = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId);
    try {
      await fs.mkdir(subTaskDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
    }

    // Save the generated exercise set to the file structure
    const exercisePath = path.join(subTaskDir, 'exercises.json');
    await fs.writeFile(exercisePath, JSON.stringify(exerciseSet, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: `Comprehensive exercise set with ${exerciseSet.questions.length} concept-focused questions saved for section "${sectionId}". Questions systematically assess key learning objectives while avoiding superficial details.` 
    });

  } catch (error) {
    console.error('Error saving exercise set:', error);
    return NextResponse.json({ 
      error: 'Failed to save exercise set',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
