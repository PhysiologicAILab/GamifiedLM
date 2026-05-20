import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isFileNewer } from '@/app/lib/file-utils';

// Interface for TOC-only data
export interface TableOfContentsData {
  blockIds: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialName = searchParams.get('filename')?.replace('.md', '') || 'sample-1';
    
    // Construct paths to the material directory and files
    const materialDir = path.join(process.cwd(), 'data', 'learning-materials', materialName);
    const contentPath = path.join(materialDir, 'content.md');
    const tocPath = path.join(materialDir, 'toc.json');
    
    // Check if content file exists
    if (!fs.existsSync(contentPath)) {
      return NextResponse.json(
        { error: 'Learning material not found' },
        { status: 404 }
      );
    }
    
    let tocData: TableOfContentsData;
    
    // Check if TOC file exists and is up to date
    if (fs.existsSync(tocPath) && isFileNewer(tocPath, contentPath)) {
      console.log(`Using existing TOC for ${materialName}`);
      const tocContent = fs.readFileSync(tocPath, 'utf8');
      tocData = JSON.parse(tocContent) as TableOfContentsData;
    } else {
      // TOC file doesn't exist or is outdated
      // Instead of generating here, suggest calling the main endpoint first
      return NextResponse.json({
        error: `Table of contents for "${materialName}" not found or outdated. Please process the learning material first by calling the main learning-materials endpoint.`,
        suggestion: `Call GET /api/learning-materials?materialName=${materialName} to generate both organized content and table of contents.`
      }, { status: 404 });
    }
    
    return NextResponse.json({
      filename: `${materialName}.md`,
      ...tocData
    });
    
  } catch (error) {
    console.error('Error reading table of contents:', error);
    return NextResponse.json(
      { error: 'Failed to load table of contents' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
