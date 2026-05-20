import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ContentOrganizer, type OrganizedContent } from '@/app/lib/content-organizer';
import { isFileNewer, ensureDirectoryExists } from '@/app/lib/file-utils';

// Interface for TOC-only data
export interface TableOfContentsData {
  blockIds: string[];
}



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialName = searchParams.get('materialName') || 'sample-1';
    
    // Construct paths to the material directory and files
    const materialDir = path.join(process.cwd(), 'data', 'learning-materials', materialName);
    const contentPath = path.join(materialDir, 'content.md');
    const organizedContentPath = path.join(materialDir, 'organized-content.json');
    const tocPath = path.join(materialDir, 'toc.json');
    
    // Check if content file exists
    if (!fs.existsSync(contentPath)) {
      return NextResponse.json(
        { error: 'Learning material not found' },
        { status: 404 }
      );
    }
    
    let analysis: OrganizedContent;
    
    // Check if both organized content and TOC exist and are newer than source
    const organizedContentExists = fs.existsSync(organizedContentPath) && isFileNewer(organizedContentPath, contentPath);
    const tocExists = fs.existsSync(tocPath) && isFileNewer(tocPath, contentPath);
    
    if (organizedContentExists && tocExists) {
      console.log(`Using existing organized content and TOC for ${materialName}`);
      const organizedContent = fs.readFileSync(organizedContentPath, 'utf8');
      analysis = JSON.parse(organizedContent) as OrganizedContent;
    } else {
      // Generate new organized content and TOC
      console.log(`Generating organized content and TOC for ${materialName}...`);
      const content = fs.readFileSync(contentPath, 'utf8');
      analysis = ContentOrganizer.organize(content);
      
      // Ensure directory exists
      ensureDirectoryExists(materialDir);
      
      // Write organized content
      fs.writeFileSync(organizedContentPath, JSON.stringify(analysis, null, 2), 'utf8');
      console.log(`Organized content saved to: ${organizedContentPath}`);
      
      // Write TOC file (always generate when organized content is generated)
      const tocData: TableOfContentsData = {
        blockIds: analysis.blocks.map(block => block.id)
      };
      fs.writeFileSync(tocPath, JSON.stringify(tocData, null, 2), 'utf8');
      console.log(`TOC saved to: ${tocPath}`);
    }
    
    return NextResponse.json({
      filename: `${materialName}.md`,
      analysis
    });
    
  } catch (error) {
    console.error('Error reading learning material:', error);
    return NextResponse.json(
      { error: 'Failed to load learning material' },
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

