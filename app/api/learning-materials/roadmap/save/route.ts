import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { materialName, roadmap } = await request.json();

    if (!materialName || !roadmap) {
      return NextResponse.json({ 
        error: 'Material name and roadmap are required' 
      }, { status: 400 });
    }

    // Calculate estimated total time from subtasks
    const estimatedTotalTime = roadmap.subtasks?.reduce((total: number, subtask: any) => total + (subtask.estimatedTime || 0), 0) || 0;
    
    // Add the calculated total time to the roadmap
    const roadmapWithTotalTime = {
      ...roadmap,
      estimatedTotalTime,
      generatedAt: new Date().toISOString()
    };

    // Save the generated roadmap to the file system
    const roadmapPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, 'roadmap.json');
    await fs.writeFile(roadmapPath, JSON.stringify(roadmapWithTotalTime, null, 2));

    return NextResponse.json({ 
      success: true, 
      roadmap: roadmapWithTotalTime,
      message: `Learning roadmap generated and saved for "${materialName}"` 
    });

  } catch (error) {
    console.error('Error saving roadmap:', error);
    return NextResponse.json({ 
      error: 'Failed to save roadmap',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

