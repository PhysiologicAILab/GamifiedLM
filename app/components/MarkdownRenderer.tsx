'use client';

import { useEffect, useState } from 'react';
import type { BlockIndex, OrganizedContent } from '@/app/lib/content-organizer';

interface KeywordData {
  word: string;
  blockId: string;
}

interface MarkdownRendererProps {
  content: string;
  analysis?: OrganizedContent;
  onBlockHover?: (block: BlockIndex | null) => void;
  highlightedBlockIds?: string[];
  keywords?: KeywordData[];
  onKeywordClick?: (keyword: string) => void;
  selectedBlockId?: string | null;
  onBlockSelect?: (blockId: string | null) => void;
}

export default function MarkdownRenderer({ content, analysis, onBlockHover, highlightedBlockIds = [], keywords = [], onKeywordClick, selectedBlockId = null, onBlockSelect }: MarkdownRendererProps) {
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  // Enhanced markdown to HTML conversion with block IDs
  const renderMarkdownWithAnalysis = () => {
    if (!analysis) {
      // Fallback to simple rendering
      return renderSimpleMarkdown(content);
    }

    let html = '';

    // Process each block with its ID
    analysis.blocks.forEach(block => {
      const blockHtml = renderBlock(block);
      html += blockHtml;
    });

    return html;
  };

  // Helper functions to parse type and level from ID
  const parseBlockType = (id: string): string => {
    if (id.startsWith('heading-')) return 'heading';
    if (id.includes('-paragraph-')) return 'paragraph';
    if (id.includes('-code-')) return 'code';
    if (id.includes('-table-')) return 'table';
    if (id.includes('-image-')) return 'image';
    if (id.includes('-list-')) return 'list';
    if (id.includes('-blockquote-')) return 'blockquote';
    if (id.includes('-hr-')) return 'hr';
    return 'paragraph'; // default
  };

  const parseHeadingLevel = (id: string): number => {
    const match = id.match(/^heading-(\d+)-/);
    return match ? parseInt(match[1]) : 1;
  };

  const renderBlock = (block: BlockIndex): string => {
    const blockId = block.id;
    const blockType = parseBlockType(blockId);
    const isHighlighted = highlightedBlockIds.includes(blockId);
    const isSelected = selectedBlockId === blockId;
    const hoverClasses = hoveredBlock === blockId ? 'bg-blue-50' : '';
    const highlightClasses = isHighlighted ? 'bg-purple-50 border-l-4 border-purple-500 shadow-lg shadow-purple-500/20' : '';
    const selectedClasses = isSelected ? 'ring-2 ring-amber-400 bg-amber-50/70 shadow-md shadow-amber-300/30' : '';
    const interactiveClasses = onBlockSelect ? 'cursor-pointer hover:ring-1 hover:ring-amber-300/60' : '';
    const baseClasses = 'rounded-md p-2 -m-2 transition-all duration-300';
    const combinedClasses = `${baseClasses} ${hoverClasses} ${highlightClasses} ${selectedClasses} ${interactiveClasses}`;

    // Inline interaction handlers; the click handler skips when the user is
    // selecting text or clicking a keyword (which stops propagation itself).
    const handleBlockInteraction = `
      data-block-id="${blockId}"
      onmouseenter="window.handleBlockHover && window.handleBlockHover('${blockId}', 'enter')"
      onmouseleave="window.handleBlockHover && window.handleBlockHover('${blockId}', 'leave')"
      onclick="if(window.getSelection && window.getSelection().toString()) return; window.handleBlockSelect && window.handleBlockSelect('${blockId}')"
    `;

    switch (blockType) {
      case 'heading':
        const level = parseHeadingLevel(blockId);
        const headingClasses = {
          1: 'text-3xl font-bold text-gray-800 border-b-2 border-purple-200 py-6',
          2: 'text-2xl font-semibold text-gray-800 py-4',
          3: 'text-xl font-semibold text-gray-800 py-4',
          4: 'text-lg font-semibold text-gray-800 py-3',
          5: 'text-base font-semibold text-gray-800 py-3',
          6: 'text-sm font-semibold text-gray-800 py-2'
        };
        return `<h${level} id="${blockId}" class="${headingClasses[level as keyof typeof headingClasses]} ${combinedClasses}" ${handleBlockInteraction}>${formatInlineElements(block.content, blockId)}</h${level}>`;

      case 'paragraph':
        return `<p id="${blockId}" class="text-gray-700 py-4 leading-relaxed ${combinedClasses}" ${handleBlockInteraction}>${formatInlineElements(block.content, blockId)}</p>`;

      case 'code':
        const language = block.metadata?.language || '';
        const normalizedCode = normalizeCodeContent(block.content);
        return `<div id="${blockId}" class="my-3 first:mt-0 last:mb-0 ${combinedClasses}" ${handleBlockInteraction}>
          <pre class="bg-gray-50 text-gray-800 p-3 rounded-lg overflow-x-auto border border-gray-200 shadow-sm"><code class="text-sm font-mono leading-relaxed ${language ? `language-${language}` : ''}">${escapeHtml(normalizedCode)}</code></pre>
        </div>`;

      case 'table':
        const headers = block.metadata?.headers || [];
        const rows = block.metadata?.rows || [];
        const headerRow = '<tr>' + headers.map(header => 
          `<th class="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-gray-800">${formatInlineElements(header, blockId)}</th>`
        ).join('') + '</tr>';
        
        const bodyRows = rows.map(row => 
          '<tr>' + row.map(cell => 
            `<td class="border border-gray-300 px-4 py-2 text-gray-700">${formatInlineElements(cell, blockId)}</td>`
          ).join('') + '</tr>'
        ).join('');
        
        return `<div id="${blockId}" class="overflow-x-auto py-4 ${combinedClasses}" ${handleBlockInteraction}>
          <table class="min-w-full border-collapse border border-gray-300 bg-white rounded-lg shadow-sm">
            <thead>${headerRow}</thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>`;

      case 'image':
        const src = block.metadata?.src || '';
        const alt = block.metadata?.alt || '';
        return `<div id="${blockId}" py-4 class="flex justify-center ${combinedClasses}" ${handleBlockInteraction}>
          <img src="${src}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-md border border-gray-200" loading="lazy" />
        </div>`;

      case 'list':
        const isOrdered = block.metadata?.ordered || false;
        const items = block.metadata?.items || [];
        const listItems = items.map(item => 
          `<li class="mb-1">${formatInlineElements(item, blockId)}</li>`
        ).join('');
        
        if (isOrdered) {
          return `<ol id="${blockId}" class="list-decimal list-inside py-4 ml-4 text-gray-700 ${combinedClasses}" ${handleBlockInteraction}>${listItems}</ol>`;
        } else {
          return `<ul id="${blockId}" class="list-disc list-inside py-4 ml-4 text-gray-700 ${combinedClasses}" ${handleBlockInteraction}>${listItems}</ul>`;
        }

      case 'blockquote':
        return `<blockquote id="${blockId}" class="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50 text-gray-700 italic ${combinedClasses}" ${handleBlockInteraction}>
          ${formatInlineElements(block.content, blockId)}
        </blockquote>`;

      case 'hr':
        return `<hr id="${blockId}" class="border-t-2 border-gray-200 ${combinedClasses}" ${handleBlockInteraction} />`;

      default:
        return `<div id="${blockId}" class="${combinedClasses}" ${handleBlockInteraction}>${formatInlineElements(block.content, blockId)}</div>`;
    }
  };

  // Helper function to highlight keywords within text
  const highlightKeywords = (text: string, blockId: string): string => {
    if (!keywords || keywords.length === 0) return text;
    
    // Get keywords for this specific block
    const blockKeywords = keywords.filter(keyword => keyword.blockId === blockId);
    if (blockKeywords.length === 0) return text;
    
    // Sort keywords by length in descending order to prioritize longer phrases
    const sortedKeywords = [...blockKeywords].sort((a, b) => b.word.length - a.word.length);
    
    let result = text;
    
    for (const keyword of sortedKeywords) {
      // Escape special regex characters in the keyword
      const escapedKeyword = keyword.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create a case-insensitive regex to find the keyword (word boundary matching)
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      
      // Replace only if the keyword hasn't already been highlighted
      if (regex.test(result) && !result.includes(`data-keyword="${keyword.word}"`)) {
        const highlightedKeyword = `<span 
          class="px-1 py-0.5 rounded cursor-pointer bg-purple-100 border-b-2 border-purple-400 relative keyword-highlight hover:bg-purple-200 transition-colors" 
          data-keyword="${keyword.word}"
          title="Click to learn more about '${keyword.word}'"
          onclick="event.stopPropagation(); window.handleKeywordClick && window.handleKeywordClick('${keyword.word}')"
        >$&</span>`;
        
        result = result.replace(regex, highlightedKeyword);
      }
    }
    
    return result;
  };

  const formatInlineElements = (text: string, blockId?: string): string => {
    let html = text;
    
    // Apply keyword highlighting first (before other formatting)
    if (blockId) {
      html = highlightKeywords(html, blockId);
    }
    
    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>');
    
    // Italic text  
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-50 px-1.5 py-0.5 rounded text-sm font-mono text-gray-700 border border-gray-200">$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-600 hover:text-purple-800 underline">$1</a>');
    
    return html;
  };

  const renderSimpleMarkdown = (text: string): string => {
    let html = text;
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold text-gray-800">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold text-gray-800">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-gray-800 border-b-2 border-purple-200 pb-2">$1</h1>');
    
    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>');
    
    // Italic text
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');
    
    // Code blocks with language detection
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || '';
      const cleanCode = normalizeCodeContent(code);
      return `<div class="my-3 first:mt-0 last:mb-0">
        <pre class="bg-gray-50 text-gray-800 p-3 rounded-lg overflow-x-auto border border-gray-200 shadow-sm"><code class="text-sm font-mono leading-relaxed ${language ? `language-${language}` : ''}">${cleanCode}</code></pre>
      </div>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-blue-50 px-1.5 py-0.5 rounded text-sm font-mono text-blue-700 border border-blue-200">$1</code>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  const escapeHtml = (text: string): string => {
    if (typeof document === 'undefined') {
      // Server-side fallback
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Helper function to normalize code content and remove excessive indentation
  const normalizeCodeContent = (code: string): string => {
    // Remove leading and trailing whitespace
    const trimmed = code.trim();
    if (!trimmed) return '';
    
    // Split into lines
    const lines = trimmed.split('\n');
    
    // Find the minimum indentation (excluding empty lines)
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    if (nonEmptyLines.length === 0) return trimmed;
    
    const minIndent = Math.min(
      ...nonEmptyLines.map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      })
    );
    
    // Remove the common indentation from all lines
    const normalizedLines = lines.map(line => {
      if (line.trim().length === 0) return ''; // Keep empty lines empty
      return line.slice(minIndent);
    });
    
    return normalizedLines.join('\n');
  };

  // Set up hover handlers
  useEffect(() => {
    if (!analysis) return;

    const handleBlockHover = (blockId: string, action: 'enter' | 'leave') => {
      if (action === 'enter') {
        setHoveredBlock(blockId);
        const block = analysis.blocks.find(b => b.id === blockId);
        onBlockHover?.(block || null);
      } else {
        setHoveredBlock(null);
        onBlockHover?.(null);
      }
    };

    // Expose handlers to global scope for inline event handlers
    (window as any).handleBlockHover = handleBlockHover;

    const handleKeywordClick = (keyword: string) => {
      onKeywordClick?.(keyword);
    };
    (window as any).handleKeywordClick = handleKeywordClick;

    // Click on a block "pins" it as the focused paragraph for the AI companion.
    // Clicking the same block again clears the selection.
    const handleBlockSelect = (blockId: string) => {
      if (!onBlockSelect) return;
      onBlockSelect(selectedBlockId === blockId ? null : blockId);
    };
    (window as any).handleBlockSelect = handleBlockSelect;

    return () => {
      delete (window as any).handleBlockHover;
      delete (window as any).handleKeywordClick;
      delete (window as any).handleBlockSelect;
    };
  }, [analysis, onBlockHover, keywords, onKeywordClick, onBlockSelect, selectedBlockId]);

  return (
    <div className="relative">
      <div 
        className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdownWithAnalysis() }}
      />
      
    </div>
  );
}

