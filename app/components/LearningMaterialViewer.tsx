'use client';

import { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import type { BlockIndex, OrganizedContent } from '@/app/lib/content-organizer';

interface KeywordData {
  word: string;
  blockId: string;
}

interface LearningMaterialViewerProps {
  materialName?: string;
  onContentLoad?: (content: string) => void;
  onAnalysisUpdate?: (analysis: OrganizedContent) => void;
  onBlockHover?: (block: BlockIndex | null) => void;
  highlightedBlockIds?: string[];
  keywords?: KeywordData[];
  onKeywordClick?: (keyword: string) => void;
  selectedBlockId?: string | null;
  onBlockSelect?: (blockId: string | null) => void;
}

interface LearningMaterial {
  filename: string;
  analysis: OrganizedContent;
}

function extractContentFromAnalysis(analysis: OrganizedContent): string {
  // Reconstruct the full content from all blocks
  return analysis.blocks.map(block => block.content).join('\n');
}

export default function LearningMaterialViewer({ materialName = 'sample-1', onContentLoad, onAnalysisUpdate, onBlockHover, highlightedBlockIds = [], keywords = [], onKeywordClick, selectedBlockId = null, onBlockSelect }: LearningMaterialViewerProps) {
  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLearningMaterial();
  }, [materialName]);

  const fetchLearningMaterial = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/learning-materials?materialName=${materialName}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch learning material');
      }
      
      const data: LearningMaterial = await response.json();
      setMaterial(data);
      
      // Extract content from analysis and notify parent component
      if (onContentLoad && data.analysis) {
        const content = extractContentFromAnalysis(data.analysis);
        onContentLoad(content);
      }
      
      // Notify parent component about analysis data
      if (onAnalysisUpdate && data.analysis) {
        onAnalysisUpdate(data.analysis);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-white backdrop-blur-sm border-r flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading learning material...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-white backdrop-blur-sm border-r flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="mb-4">Error: {error}</p>
          <button 
            onClick={() => fetchLearningMaterial()}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleBlockHover = (block: BlockIndex | null) => {
    if (onBlockHover) {
      onBlockHover(block);
    }
  };

  return (
    <div className="h-full bg-white backdrop-blur-sm border-r flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {material && material.analysis && (
            <MarkdownRenderer 
              content={extractContentFromAnalysis(material.analysis)} 
              analysis={material.analysis}
              onBlockHover={handleBlockHover}
              highlightedBlockIds={highlightedBlockIds}
              keywords={keywords}
              onKeywordClick={onKeywordClick}
              selectedBlockId={selectedBlockId}
              onBlockSelect={onBlockSelect}
            />
          )}
        </div>
      </div>


    </div>
  );
}
