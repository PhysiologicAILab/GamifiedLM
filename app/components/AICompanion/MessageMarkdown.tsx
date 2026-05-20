'use client';

interface MessageMarkdownProps {
  content: string;
  className?: string;
}

export default function MessageMarkdown({ content, className = "" }: MessageMarkdownProps) {
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

  // Enhanced markdown to HTML conversion with consistent styling
  const renderMarkdown = (text: string): string => {
    let html = text;
    
    // Escape HTML to prevent XSS
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // Code blocks (must come before inline code) - optimized for dark message bubbles
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || '';
      const languageLabel = language ? language.toUpperCase() : 'CODE';
      const cleanCode = normalizeCodeContent(code);
      return `<div class="my-3 first:mt-0 last:mb-0">
        <div class="relative group">
          <div class="flex items-center justify-between bg-slate-600/80 backdrop-blur-sm px-3 py-2 rounded-t-lg border border-slate-500/50">
            <span class="text-xs font-medium text-purple-300 tracking-wide">${languageLabel}</span>
            <button 
              onclick="navigator.clipboard.writeText(\`${cleanCode.replace(/`/g, '\\`')}\`); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000)"
              class="text-xs text-slate-200 hover:text-purple-300 transition-colors px-2 py-1 rounded hover:bg-purple-500/20"
            >Copy</button>
          </div>
          <pre class="bg-slate-700/90 backdrop-blur-sm text-slate-50 p-3 rounded-b-lg overflow-x-auto border border-t-0 border-slate-500/50 shadow-lg shadow-black/20"><code class="text-sm font-mono leading-relaxed ${language ? `language-${language}` : ''}">${cleanCode}</code></pre>
        </div>
      </div>`;
    });
    
    // Inline code - optimized for dark backgrounds
    html = html.replace(/`([^`\n]+)`/g, 
      '<code class="bg-slate-600/60 px-1.5 py-0.5 rounded text-sm font-mono text-purple-200 border border-slate-500/50">$1</code>'
    );
    
    // Bold text - consistent weight
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    
    // Italic text - consistent styling
    html = html.replace(/\*(.*?)\*/g, '<em class="italic opacity-90">$1</em>');
    
    // Links - consistent hover effects
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" class="text-purple-300 hover:text-purple-200 underline transition-colors" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Strikethrough
    html = html.replace(/~~(.*?)~~/g, '<del class="line-through opacity-75">$1</del>');
    
    // Headers with consistent hierarchy and spacing
    html = html.replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-medium mt-4 mb-2 first:mt-0 text-white opacity-90">$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="text-sm font-medium mt-4 mb-2 first:mt-0 text-white">$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4 class="text-base font-semibold mt-4 mb-2 first:mt-0 text-white">$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 first:mt-0 text-white">$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-3 first:mt-0 text-white">$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold mt-5 mb-3 first:mt-0 text-white border-b border-white/20 pb-2">$1</h1>');
    
    // Lists - improved spacing and nesting
    html = html.replace(/^(\s*)[-*+]\s+(.+)$/gm, (match, indent, content) => {
      const level = Math.floor(indent.length / 2);
      const marginClass = level === 0 ? 'my-2 first:mt-0 last:mb-0' : '';
      const indentClass = level > 0 ? `ml-${Math.min(level * 4, 8)}` : '';
      return `<ul class="list-disc list-inside ${indentClass} ${marginClass}"><li class="mb-1 leading-relaxed">${content}</li></ul>`;
    });
    
    html = html.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, (match, indent, num, content) => {
      const level = Math.floor(indent.length / 2);
      const marginClass = level === 0 ? 'my-2 first:mt-0 last:mb-0' : '';
      const indentClass = level > 0 ? `ml-${Math.min(level * 4, 8)}` : '';
      return `<ol class="list-decimal list-inside ${indentClass} ${marginClass}"><li class="mb-1 leading-relaxed">${content}</li></ol>`;
    });
    
    // Blockquotes - consistent with MarkdownRenderer
    html = html.replace(/^>\s+(.+)$/gm, 
      '<blockquote class="border-l-4 border-purple-300/50 pl-4 py-2 my-3 first:mt-0 last:mb-0 bg-purple-50/10 italic opacity-90">$1</blockquote>'
    );
    
    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr class="border-t-2 border-white/20 my-4 first:mt-0 last:mb-0" />');
    
    // Paragraphs - improved spacing
    html = html.replace(/\n\n+/g, '</p><p class="mt-3 mb-0 leading-relaxed">');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap content in paragraph with proper spacing
    const hasBlockElements = /<(h[1-6]|div|ul|ol|blockquote|pre|hr)/.test(html);
    
    if (!hasBlockElements) {
      html = `<p class="leading-relaxed mb-0">${html}</p>`;
    } else {
      // Ensure content starts with a paragraph if it doesn't start with a block element
      if (!html.match(/^<(h[1-6]|div|ul|ol|blockquote|pre|hr)/)) {
        html = `<p class="leading-relaxed mb-0">${html}</p>`;
      } else if (html.includes('</p><p class="mt-3 mb-0 leading-relaxed">')) {
        html = `<p class="leading-relaxed mb-0">${html}</p>`;
      }
    }
    
    return html;
  };

  return (
    <div 
      className={`prose prose-sm max-w-none prose-headings:text-white prose-p:text-slate-100 prose-strong:text-white prose-em:text-slate-200 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
