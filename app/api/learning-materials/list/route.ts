import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const materialsPath = join(process.cwd(), 'data', 'learning-materials');
    const entries = await readdir(materialsPath);
    
    const materials = [];
    
    for (const entry of entries) {
      const entryPath = join(materialsPath, entry);
      const stats = await stat(entryPath);
      
      if (stats.isDirectory()) {
        // Check if it has the required files to be a valid learning material
        try {
          const files = await readdir(entryPath);
          const hasContent = files.includes('content.md');
          const hasRoadmap = files.includes('roadmap.json');
          
          if (hasContent && hasRoadmap) {
            materials.push({
              id: entry,
              name: entry.replace(/^sample-/, 'Sample '), // Format display name
              path: entry
            });
          }
        } catch (error) {
          // Skip directories that can't be read
          continue;
        }
      }
    }
    
    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Error reading learning materials:', error);
    return NextResponse.json(
      { error: 'Failed to load learning materials' },
      { status: 500 }
    );
  }
}

