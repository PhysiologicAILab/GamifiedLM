export interface BlockIndex {
  id: string; // Now contains type, level, and hierarchical context
  content: string;
  metadata?: {
    // For images
    src?: string;
    alt?: string;
    // For tables
    headers?: string[];
    rows?: string[][];
    // For code blocks
    language?: string;
    // For lists
    ordered?: boolean;
    items?: string[];
    // For headings
    anchor?: string;
  };
}

export interface OrganizedContent {
  blocks: BlockIndex[];
  wordCount: number;
  readingTime: number; // in minutes
}


interface HeadingContext {
  level: number;
  title: string;
  slug: string;
}

export class ContentOrganizer {
  private static createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  }

  private static generateHeadingId(level: number, content: string): string {
    const slug = this.createSlug(content);
    return `heading-${level}-${slug}`;
  }

  private static generateContextualId(
    type: string, 
    headingHierarchy: HeadingContext[], 
    typeCounter: number,
    content?: string
  ): string {
    // Skip heading-1 (document title) from context path
    const contextPath = headingHierarchy
      .filter(h => h.level > 1)
      .map(h => h.slug)
      .join('-');
    
    const contentSlug = content ? this.createSlug(content) : '';
    const baseId = contextPath 
      ? `${contextPath}-${type}-${typeCounter}`
      : `${type}-${typeCounter}`;
    
    return contentSlug ? `${baseId}-${contentSlug}` : baseId;
  }

  private static generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private static calculateReadingTime(wordCount: number): number {
    const averageWordsPerMinute = 200;
    return Math.ceil(wordCount / averageWordsPerMinute);
  }

  private static countWords(text: string): number {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  public static organize(markdown: string): OrganizedContent {
    const lines = markdown.split('\n');
    const blocks: BlockIndex[] = [];
    let currentLine = 0;
    let totalWordCount = 0;

    // Track heading hierarchy and type counters
    const headingHierarchy: HeadingContext[] = [];
    const typeCounters: { [key: string]: number } = {
      paragraph: 0,
      code: 0,
      table: 0,
      image: 0,
      list: 0,
      blockquote: 0,
      hr: 0
    };

    while (currentLine < lines.length) {
      const line = lines[currentLine];
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        currentLine++;
        continue;
      }

      // Process different block types
      const blockResult = this.processBlock(lines, currentLine, headingHierarchy, typeCounters);
      
      if (blockResult) {
        blocks.push(blockResult.block);
        totalWordCount += this.countWords(blockResult.block.content);
        currentLine = blockResult.nextLine;
        
        // Update heading hierarchy if this is a heading
        if (blockResult.block.id.startsWith('heading-')) {
          this.updateHeadingHierarchy(headingHierarchy, blockResult.headingInfo!);
          // Reset paragraph counter for new section
          typeCounters.paragraph = 0;
        }
      } else {
        // Default to paragraph if no specific type detected
        const paragraphResult = this.processParagraph(lines, currentLine, headingHierarchy, typeCounters);
        blocks.push(paragraphResult.block);
        totalWordCount += this.countWords(paragraphResult.block.content);
        currentLine = paragraphResult.nextLine;
      }
    }

    return {
      blocks,
      wordCount: totalWordCount,
      readingTime: this.calculateReadingTime(totalWordCount)
    };
  }

  private static updateHeadingHierarchy(hierarchy: HeadingContext[], newHeading: HeadingContext): void {
    // Remove any headings at the same or deeper level
    while (hierarchy.length > 0 && hierarchy[hierarchy.length - 1].level >= newHeading.level) {
      hierarchy.pop();
    }
    // Add the new heading
    hierarchy.push(newHeading);
  }

  private static processBlock(
    lines: string[], 
    startLine: number, 
    headingHierarchy: HeadingContext[],
    typeCounters: { [key: string]: number }
  ): { block: BlockIndex; nextLine: number; headingInfo?: HeadingContext } | null {
    const line = lines[startLine].trim();

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      return this.processHeading(lines, startLine, headingMatch);
    }

    // Code block
    if (line.startsWith('```')) {
      typeCounters.code++;
      return this.processCodeBlock(lines, startLine, headingHierarchy, typeCounters);
    }

    // Table
    if (this.isTableStart(lines, startLine)) {
      typeCounters.table++;
      return this.processTable(lines, startLine, headingHierarchy, typeCounters);
    }

    // Image
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      typeCounters.image++;
      return this.processImage(lines, startLine, headingHierarchy, typeCounters, imageMatch);
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      typeCounters.hr++;
      return this.processHorizontalRule(lines, startLine, headingHierarchy, typeCounters);
    }

    // List
    if (line.match(/^(\s*[-*+]|\s*\d+\.)\s+/)) {
      typeCounters.list++;
      return this.processList(lines, startLine, headingHierarchy, typeCounters);
    }

    // Blockquote
    if (line.startsWith('>')) {
      typeCounters.blockquote++;
      return this.processBlockquote(lines, startLine, headingHierarchy, typeCounters);
    }

    return null;
  }

  private static processHeading(
    lines: string[],
    startLine: number,
    match: RegExpMatchArray
  ): { block: BlockIndex; nextLine: number; headingInfo: HeadingContext } {
    const level = match[1].length;
    const content = match[2];
    const anchor = this.generateAnchor(content);
    const slug = this.createSlug(content);
    const id = this.generateHeadingId(level, content);

    const headingInfo: HeadingContext = {
      level,
      title: content,
      slug
    };

    const block: BlockIndex = {
      id,
      content,
      metadata: { anchor }
    };

    return {
      block,
      nextLine: startLine + 1,
      headingInfo
    };
  }

  private static processCodeBlock(
    lines: string[],
    startLine: number,
    headingHierarchy: HeadingContext[],
    typeCounters: { [key: string]: number }
  ): { block: BlockIndex; nextLine: number } {
    const startMarker = lines[startLine];
    const languageMatch = startMarker.match(/^```(\w+)?/);
    const language = languageMatch?.[1] || '';
    
    let endLine = startLine + 1;
    let content = '';

    // Find the closing ```
    while (endLine < lines.length && !lines[endLine].trim().startsWith('```')) {
      content += (content ? '\n' : '') + lines[endLine];
      endLine++;
    }

    const id = this.generateContextualId('code', headingHierarchy, typeCounters.code);

    const block: BlockIndex = {
      id,
      content,
      metadata: { language }
    };

    return {
      block,
      nextLine: endLine + 1
    };
  }

  private static isTableStart(lines: string[], startLine: number): boolean {
    if (startLine + 1 >= lines.length) return false;
    
    const currentLine = lines[startLine].trim();
    const nextLine = lines[startLine + 1].trim();
    
    return currentLine.includes('|') && 
           nextLine.match(/^\|?[-\s\|]+\|?$/) !== null;
  }

  private static processTable(
    lines: string[],
    startLine: number,
    headingHierarchy: HeadingContext[],
    typeCounters: { [key: string]: number }
  ): { block: BlockIndex; nextLine: number } {
    const headerLine = lines[startLine];
    
    // Parse headers
    const headers = headerLine.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell);

    // Find all table rows
    let endLine = startLine + 2;
    const rows: string[][] = [];

    while (endLine < lines.length && lines[endLine].trim().includes('|')) {
      const rowCells = lines[endLine].split('|')
        .map(cell => cell.trim())
        .filter(cell => cell);
      rows.push(rowCells);
      endLine++;
    }

    const content = `Table with ${headers.length} columns and ${rows.length} rows`;
    const id = this.generateContextualId('table', headingHierarchy, typeCounters.table);

    const block: BlockIndex = {
      id,
      content,
      metadata: { headers, rows }
    };

    return {
      block,
      nextLine: endLine
    };
  }

  private static processImage(
    lines: string[],
    startLine: number,
    headingHierarchy: HeadingContext[],
    typeCounters: { [key: string]: number },
    match: RegExpMatchArray
  ): { block: BlockIndex; nextLine: number } {
    const alt = match[1];
    const src = match[2];
    const content = alt || `Image: ${src}`;
    const id = this.generateContextualId('image', headingHierarchy, typeCounters.image, alt);

    const block: BlockIndex = {
      id,
      content,
      metadata: { src, alt }
    };

    return {
      block,
      nextLine: startLine + 1
    };
  }

  private static processHorizontalRule(
    lines: string[],
    startLine: number,
    headingHierarchy: HeadingContext[],
    typeCounters: { [key: string]: number }
  ): { block: BlockIndex; nextLine: number } {
    const id = this.generateContextualId('hr', headingHierarchy, typeCounters.hr);

    const block: BlockIndex = {
      id,
      content: 'Horizontal rule'
    };

    return {
      block,
      nextLine: startLine + 1
    };
  }

  private static processList(
    lines: string[],
    startLine: number,
    headingHierarchy: HeadingContext[],
    typeCounters: { [key: string]: number }
  ): { block: BlockIndex; nextLine: number } {
    const firstLine = lines[startLine].trim();
    const isOrdered = /^\d+\./.test(firstLine);
    
    let endLine = startLine;
    const items: string[] = [];

    // Collect all list items
    while (endLine < lines.length) {
      const line = lines[endLine].trim();
      if (!line) {
        endLine++;
        continue;
      }
      
      const listMatch = line.match(/^(\s*[-*+]|\s*\d+\.)\s+(.+)$/);
      if (listMatch) {
        items.push(listMatch[2]);
        endLine++;
      } else if (line.match(/^\s+/) && items.length > 0) {
        // Continuation of previous item
        items[items.length - 1] += ' ' + line.trim();
        endLine++;
      } else {
        break;
      }
    }

    const content = `${isOrdered ? 'Ordered' : 'Unordered'} list with ${items.length} items`;
    const id = this.generateContextualId('list', headingHierarchy, typeCounters.list);

    const block: BlockIndex = {
      id,
      content,
      metadata: { ordered: isOrdered, items }
    };

    return {
      block,
      nextLine: endLine
    };
  }

  private static processBlockquote(
    lines: string[],
    startLine: number,
    headingHierarchy: HeadingContext[],
    typeCounters: { [key: string]: number }
  ): { block: BlockIndex; nextLine: number } {
    let endLine = startLine;
    let content = '';

    while (endLine < lines.length) {
      const line = lines[endLine];
      const trimmed = line.trim();
      
      if (trimmed.startsWith('>')) {
        const quoteContent = trimmed.substring(1).trim();
        content += (content ? '\n' : '') + quoteContent;
        endLine++;
      } else if (!trimmed && content) {
        // Empty line within blockquote
        content += '\n';
        endLine++;
      } else {
        break;
      }
    }

    const id = this.generateContextualId('blockquote', headingHierarchy, typeCounters.blockquote);

    const block: BlockIndex = {
      id,
      content
    };

    return {
      block,
      nextLine: endLine
    };
  }

  private static processParagraph(
    lines: string[],
    startLine: number,
    headingHierarchy: HeadingContext[],
    typeCounters: { [key: string]: number }
  ): { block: BlockIndex; nextLine: number } {
    let endLine = startLine;
    let content = '';

    while (endLine < lines.length) {
      const line = lines[endLine];
      const trimmed = line.trim();
      
      if (!trimmed) {
        if (content) break; // End of paragraph
        // Skip empty lines at start
        endLine++;
        continue;
      }

      // Check if this line starts a new block type
      if (endLine > startLine && this.isBlockStart(trimmed)) {
        break;
      }

      content += (content ? ' ' : '') + trimmed;
      endLine++;
    }

    typeCounters.paragraph++;
    const id = this.generateContextualId('paragraph', headingHierarchy, typeCounters.paragraph);

    const block: BlockIndex = {
      id,
      content
    };

    return {
      block,
      nextLine: endLine
    };
  }

  private static isBlockStart(line: string): boolean {
    return (
      line.match(/^#{1,6}\s/) !== null || // Heading
      line.startsWith('```') || // Code block
      line.match(/^[-*_]{3,}$/) !== null || // HR
      line.match(/^(\s*[-*+]|\s*\d+\.)\s+/) !== null || // List
      line.startsWith('>') || // Blockquote
      line.match(/^!\[.*\]\(.*\)$/) !== null // Image
    );
  }

}
