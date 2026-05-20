'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import LearningMaterialViewer from "../../components/LearningMaterialViewer";
import AIPanel from "../../components/AIPanel";
import NarrativePanel from "../../components/NarrativePanel";
import type { BlockIndex, OrganizedContent } from '@/app/lib/content-organizer';

interface KeywordData {
  word: string;
  blockId: string;
}

export default function LearnPage() {
  const params = useParams();
  const materialId = params.materialId as string;
  
  const [currentAnalysis, setCurrentAnalysis] = useState<OrganizedContent | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<BlockIndex | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [highlightedBlockIds, setHighlightedBlockIds] = useState<string[]>([]);
  const [materialProcessed, setMaterialProcessed] = useState(false);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [narrativePanelOpen, setNarrativePanelOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string>('subtask-1'); // Default section
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const handleAnalysisUpdate = (analysis: OrganizedContent) => {
    setCurrentAnalysis(analysis);
    setMaterialProcessed(true); // Signal that material is processed and ready for roadmap
  };

  const handleBlockHover = (block: BlockIndex | null) => {
    setHoveredBlock(block);
  };

  const handleKeywordsLoad = useCallback((keywordData: KeywordData[]) => {
    setKeywords(keywordData);
  }, []);

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(keyword);
    setNarrativePanelOpen(true);
  };

  const handleNarrativePanelClose = () => {
    setNarrativePanelOpen(false);
    setSelectedKeyword(null);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-stone-900 to-purple-900 no-scrollbar">
      <div className="flex-1 h-full overflow-hidden">
        <LearningMaterialViewer 
          materialName={materialId}
          onAnalysisUpdate={handleAnalysisUpdate}
          onBlockHover={handleBlockHover}
          highlightedBlockIds={highlightedBlockIds}
          keywords={keywords}
          onKeywordClick={handleKeywordClick}
          selectedBlockId={selectedBlockId}
          onBlockSelect={setSelectedBlockId}
        />
      </div>
      <div className="flex-1 h-full flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <AIPanel 
            materialName={materialId}
            onHighlightBlockIds={setHighlightedBlockIds} 
            materialProcessed={materialProcessed}
            onKeywordsLoad={handleKeywordsLoad}
            onSectionChange={setCurrentSectionId}
            selectedBlockId={selectedBlockId}
            onClearSelectedBlock={() => setSelectedBlockId(null)}
          />
        </div>
      </div>

      {/* Narrative Panel */}
      <NarrativePanel
        isOpen={narrativePanelOpen}
        onClose={handleNarrativePanelClose}
        keyword={selectedKeyword}
        materialName={materialId}
        sectionId={currentSectionId}
      />
    </div>
  );
}

