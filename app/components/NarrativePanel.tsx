'use client';

import { useState, useEffect } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { narrativeSchema } from '../api/learning-materials/subtasks/narratives/schema';

interface NarrativeData {
  keyword: string;
  explanation: string;
  story: string;
  materialName: string;
  sectionId: string;
  blockId: string;
  generatedAt: string;
  hasImage: boolean;
}

interface NarrativePanelProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: string | null;
  materialName: string;
  sectionId: string;
}

export default function NarrativePanel({
  isOpen,
  onClose,
  keyword,
  materialName,
  sectionId,
}: NarrativePanelProps) {
  const [narrative, setNarrative] = useState<NarrativeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Use the streaming object hook for generating new narratives
  const { 
    object: streamingNarrative, 
    submit: generateNarrative, 
    isLoading: isGenerating,
    error: streamingError,
    stop
  } = useObject({
    api: '/api/learning-materials/subtasks/narratives',
    schema: narrativeSchema,
    onFinish: async ({ object }) => {
      if (object && keyword) {
        // Start image generation in parallel (don't wait for it)
        generateImageParallel(object);
        
        // Save the completed narrative to the file system
        try {
          // Get the blockId from keywords
          let blockId = 'unknown';
          try {
            const keywordsResponse = await fetch(
              `/api/learning-materials/subtasks/keywords?materialName=${materialName}&sectionId=${sectionId}`
            );
            if (keywordsResponse.ok) {
              const keywordsData = await keywordsResponse.json();
              const keywordData = keywordsData.keywordSet?.keywords?.find((k: any) => 
                k.word.toLowerCase() === keyword.toLowerCase()
              );
              if (keywordData) {
                blockId = keywordData.blockId;
              }
            }
          } catch (e) {
            console.warn('Could not fetch blockId from keywords:', e);
          }

          const response = await fetch('/api/learning-materials/subtasks/narratives/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              materialName,
              sectionId,
              keyword,
              narrative: object,
              blockId,
              skipImageGeneration: true // Skip image generation in save endpoint
            }),
          });
          
          if (response.ok) {
            const { narrative: savedNarrative } = await response.json();
            setNarrative(savedNarrative);
          }
        } catch (error) {
          console.error('Error saving narrative:', error);
        }
      }
    },
    onError: (error) => {
      setError('Failed to generate narrative');
      console.error('Streaming error:', error);
    }
  });

  useEffect(() => {
    if (isOpen && keyword) {
      // Reset state when opening with a new keyword
      setError(null);
      setNarrative(null);
      setImagePath(null);
      setIsGeneratingImage(false);
      loadNarrative();
    }
  }, [isOpen, keyword, materialName, sectionId]);

  // Function to generate image in parallel
  const generateImageParallel = async (narrativeData: any) => {
    if (!keyword || !narrativeData) return;
    
    setIsGeneratingImage(true);
    try {
      const imageResponse = await fetch('/api/learning-materials/subtasks/narratives/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialName,
          sectionId,
          keyword,
          narrative: narrativeData
        })
      });

      if (imageResponse.ok) {
        const imageResult = await imageResponse.json();
        setImagePath(imageResult.imagePath);
      }
    } catch (error) {
      console.warn('Failed to generate image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const loadNarrative = async () => {
    if (!keyword) return;

    setIsLoadingExisting(true);

    try {
      // First, try to get existing narrative
      const getResponse = await fetch(
        `/api/learning-materials/subtasks/narratives?materialName=${materialName}&sectionId=${sectionId}&keyword=${encodeURIComponent(keyword)}`
      );

      if (getResponse.ok) {
        const { narrative: existingNarrative, imagePath: existingImagePath } = await getResponse.json();
        setNarrative(existingNarrative);
        setImagePath(existingImagePath);
      } else {
        // Generate new narrative using streaming if it doesn't exist
        setIsGeneratingImage(true); // Start image loading state immediately
        generateNarrative({ materialName, sectionId, keyword });
      }
    } catch (error) {
      console.error('Error loading narrative:', error);
      setError('Failed to load narrative');
    } finally {
      setIsLoadingExisting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl h-4/5 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-800 to-blue-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">📖 {keyword}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {isLoadingExisting ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading narrative...</p>
              </div>
            </div>
          ) : (error || streamingError) ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-400">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="mb-4">Error: {error || streamingError?.message || 'Unknown error'}</p>
                <button 
                  onClick={loadNarrative}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (narrative || streamingNarrative || isGenerating) ? (
            <div className="space-y-6">
              {/* Image */}
              {(imagePath || isGeneratingImage) && (
                <div className="relative -mx-6 -mt-6 mb-8">
                  <div className="relative w-full h-80 overflow-hidden">
                    {imagePath ? (
                      <>
                        <img
                          src={imagePath}
                          alt={`Illustration for ${(narrative || streamingNarrative)?.keyword}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide image if it fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {/* Gradient fade overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-800 to-transparent pointer-events-none"></div>
                      </>
                    ) : (
                      /* Image placeholder during generation */
                      <div className="w-full h-full bg-slate-700/30 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-slate-400 text-sm">Generating illustration...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="bg-slate-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  💡 Explanation
                  {isGenerating && !streamingNarrative?.explanation && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                </h3>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[2rem]">
                  {narrative?.explanation || streamingNarrative?.explanation || (isGenerating ? '' : '')}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-text-bottom"></span>
                  )}
                </div>
              </div>

              {/* Story */}
              <div className="bg-slate-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  📚 Story
                  {isGenerating && !streamingNarrative?.story && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                </h3>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[4rem]">
                  {narrative?.story || streamingNarrative?.story || (isGenerating ? '' : '')}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-text-bottom"></span>
                  )}
                </div>
              </div>

              {/* Meta Information */}
              {narrative && (
                <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-600">
                  Generated on {new Date(narrative.generatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
