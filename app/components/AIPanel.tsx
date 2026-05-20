'use client';

import { useState, useEffect } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { keywordSetSchema } from '../api/learning-materials/subtasks/keywords/schema';
import { LearningSection, GameState, ExerciseResults, LearningRoadmap } from './types';
import LearningRoadmapView from './LearningRoadmapView';
import StreamingLearningRoadmapView from './StreamingLearningRoadmapView';
import IntroState from './gamestates/IntroState';
import ReadingState from './gamestates/ReadingState';
import ChallengeState from './gamestates/ChallengeState';
import RewardState from './gamestates/RewardState';
import CompletedState from './gamestates/CompletedState';
import PartialScoreState from './gamestates/PartialScoreState';
import { useLearningRoadmap } from './hooks/useLearningRoadmap';
import AICompanion from './AICompanion';

interface KeywordData {
  word: string;
  blockId: string;
}

interface AIPanelProps {
  materialName?: string;
  onHighlightBlockIds?: (blockIds: string[]) => void;
  materialProcessed?: boolean;
  onKeywordsLoad?: (keywords: KeywordData[]) => void;
  onSectionChange?: (sectionId: string) => void;
  selectedBlockId?: string | null;
  onClearSelectedBlock?: () => void;
}

export default function AIPanel({ materialName = 'sample-1', onHighlightBlockIds, materialProcessed = false, onKeywordsLoad, onSectionChange, selectedBlockId = null, onClearSelectedBlock }: AIPanelProps) {
  const [gameState, setGameState] = useState<GameState>('roadmap');
  const [playerScore, setPlayerScore] = useState(0);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [partialScoreData, setPartialScoreData] = useState<{
    score: number;
    exerciseResults: ExerciseResults;
    additionalReadingTime: number;
  } | null>(null);
  const [isAdditionalReading, setIsAdditionalReading] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  
  // Use dynamic roadmap data
  const { roadmap, loading: roadmapLoading, error: roadmapError, getRoadmap } = useLearningRoadmap();
  
  // Get learning sections from roadmap (with backward compatibility)
  const learningSections = roadmap?.subtasks || roadmap?.sections || [];

  // Use the streaming object hook for generating keywords
  const {
    object: keywordObject,
    submit: generateKeywords,
    isLoading: isGeneratingKeywords,
    error: keywordError
  } = useObject({
    api: '/api/learning-materials/subtasks/keywords',
    schema: keywordSetSchema,
    onFinish: async ({ object, error }) => {
      if (object) {
        // Save the completed keyword set
        try {
          const saveResponse = await fetch('/api/learning-materials/subtasks/keywords/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              materialName,
              sectionId: object.sectionId,
              keywordSet: object,
            }),
          });

          if (!saveResponse.ok) {
            console.warn('Failed to save keyword set');
          }
        } catch (saveError) {
          console.error('Error saving keyword set:', saveError);
        }

        // Update keywords in the UI
        if (onKeywordsLoad) {
          onKeywordsLoad(object.keywords);
        }
      }
      
      if (error) {
        console.error('Keyword generation error:', error);
        if (onKeywordsLoad) {
          onKeywordsLoad([]);
        }
      }
    },
    onError: (error) => {
      console.error('Keyword generation failed:', error);
      if (onKeywordsLoad) {
        onKeywordsLoad([]);
      }
    }
  });

  // Update keywords in real-time as they stream in
  useEffect(() => {
    if (keywordObject?.keywords && onKeywordsLoad) {
      // Filter out undefined keywords and ensure type safety
      const validKeywords = keywordObject.keywords
        .filter((keyword): keyword is KeywordData => 
          keyword !== undefined && 
          keyword.word !== undefined && 
          keyword.blockId !== undefined
        )
        .map(keyword => ({
          word: keyword.word,
          blockId: keyword.blockId
        }));
      onKeywordsLoad(validKeywords);
    }
  }, [keywordObject, onKeywordsLoad]);

  // Load roadmap only after material is processed
  useEffect(() => {
    if (materialProcessed) {
      console.log('Material processed, loading roadmap...');
      getRoadmap(materialName);
    }
  }, [materialProcessed, getRoadmap, materialName]);

  const getCurrentSection = () => {
    return learningSections.find(section => section.id === currentSectionId) || null;
  };

  const handleSectionSelect = (section: LearningSection) => {
    setCurrentSectionId(section.id);
    setGameState('intro');
    
    // Clear additional reading state when starting new section
    setIsAdditionalReading(false);
    setPartialScoreData(null);
    setRetryKey(0); // Reset retry key for new section
    
    // Notify parent component of section change
    if (onSectionChange) {
      onSectionChange(section.id);
    }
    
    // Clear keywords when switching sections
    if (onKeywordsLoad) {
      onKeywordsLoad([]);
    }
  };

  const startReading = async () => {
    const currentSection = getCurrentSection();
    if (currentSection) {
      try {
        // First try to load existing keywords
        const existingKeywords = await loadExistingKeywords(currentSection);
        if (existingKeywords.length > 0) {
          // Use existing keywords
          if (onKeywordsLoad) {
            onKeywordsLoad(existingKeywords);
          }
        } else {
          // Generate new keywords using streaming
          generateKeywords({
            materialName,
            sectionId: currentSection.id,
            currentSection: currentSection,
          });
        }
        
        // Transition to reading state
        setGameState('reading');
        
        // Highlight the blocks for this section
        if (onHighlightBlockIds) {
          onHighlightBlockIds(currentSection.blockIds);
        }
      } catch (error) {
        console.error('Error in startReading:', error);
        // Still transition to reading state even if keywords fail
        setGameState('reading');
        if (onHighlightBlockIds) {
          onHighlightBlockIds(currentSection.blockIds);
        }
      }
    }
  };

  const loadExistingKeywords = async (section: LearningSection): Promise<KeywordData[]> => {
    try {
      const getResponse = await fetch(`/api/learning-materials/subtasks/keywords?materialName=${materialName}&sectionId=${section.id}`);
      
      if (getResponse.ok) {
        const { keywordSet } = await getResponse.json();
        return keywordSet.keywords || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error loading existing keywords:', error);
      return [];
    }
  };

  const handleTimerComplete = () => {
    const currentSection = getCurrentSection();
    if (currentSection) {
      // Clear additional reading state when timer completes
      if (isAdditionalReading) {
        setIsAdditionalReading(false);
        setPartialScoreData(null);
        // Increment retry key to signal a retry to ChallengeState
        setRetryKey(prev => prev + 1);
      }
      setGameState('challenge');
    }
  };

  const handleChallengeComplete = (score?: number, exerciseResults?: ExerciseResults) => {
    const currentSection = getCurrentSection();
    if (currentSection) {
      setCompletedSections(prev => [...prev, currentSection.id]);
      // Use the actual score from exercises if provided, otherwise use default
      const pointsToAdd = score ?? 150;
      setPlayerScore(prev => prev + pointsToAdd);
      setGameState('reward');
      
      // You could store exerciseResults for analytics or detailed feedback
      if (exerciseResults) {
        console.log('Exercise Results:', exerciseResults);
      }
    }
  };

  const handlePartialScore = (score: number, exerciseResults: ExerciseResults) => {
    const currentSection = getCurrentSection();
    if (currentSection && exerciseResults) {
      // Calculate additional reading time based on wrong percentage
      const wrongPercentage = (exerciseResults.totalQuestions - exerciseResults.correctAnswers) / exerciseResults.totalQuestions;
      const additionalReadingTime = Math.ceil(currentSection.estimatedTime * 60 * wrongPercentage); // in seconds

      setPartialScoreData({
        score,
        exerciseResults,
        additionalReadingTime
      });
      setGameState('partial-score');
    }
  };

  const handleGoBackToReading = () => {
    // Set the game state back to reading with only additional time
    setIsAdditionalReading(true);
    setGameState('reading');
    // Don't clear partialScoreData yet - we need it for the timer duration
  };

  const handleRewardContinue = () => {
    const nextSectionIndex = learningSections.findIndex(s => s.id === currentSectionId) + 1;
    if (nextSectionIndex < learningSections.length) {
      setGameState('roadmap');
      setCurrentSectionId(null);
      
      // Clear highlighting when returning to roadmap
      if (onHighlightBlockIds) {
        onHighlightBlockIds([]);
      }
    } else {
      setGameState('completed');
      
      // Clear highlighting when completing all sections
      if (onHighlightBlockIds) {
        onHighlightBlockIds([]);
      }
    }
  };

  const handleReturnToRoadmap = () => {
    setGameState('roadmap');
    setCurrentSectionId(null);
    
    // Clear additional reading state when returning to roadmap
    setIsAdditionalReading(false);
    setPartialScoreData(null);
    
    // Clear highlighting when returning to roadmap
    if (onHighlightBlockIds) {
      onHighlightBlockIds([]);
    }
  };

  const resetGame = () => {
    setPlayerScore(0);
    setCompletedSections([]);
    setCurrentSectionId(null);
    setGameState('roadmap');
    
    // Clear highlighting when resetting
    if (onHighlightBlockIds) {
      onHighlightBlockIds([]);
    }
  };

  const currentSection = getCurrentSection();

  return (
    <div className="h-full flex flex-col p-6 relative">
      {/* Game Content */}
      <div className="flex-1 w-full min-h-0 overflow-hidden">
        {gameState === 'roadmap' && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            {!materialProcessed ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">📚</div>
                </div>
                <p className="text-slate-300 text-lg">Preparing learning material...</p>
                <p className="text-slate-400 text-sm mt-2">Processing content for your adventure</p>
              </div>
            ) : isGeneratingRoadmap ? (
              <StreamingLearningRoadmapView
                materialName={materialName}
                playerScore={playerScore}
                onComplete={(completedRoadmap) => {
                  setIsGeneratingRoadmap(false);
                  // Trigger a refresh to get the saved roadmap
                  getRoadmap(materialName);
                }}
                onError={(error) => {
                  setIsGeneratingRoadmap(false);
                  console.error('Streaming roadmap generation failed:', error);
                }}
              />
            ) : roadmapLoading ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🗺️</div>
                </div>
                <p className="text-slate-300 text-lg">Loading your adventure map...</p>
                <p className="text-slate-400 text-sm mt-2">Retrieving your saved journey</p>
              </div>
            ) : roadmapError ? (
              <div className="p-6 text-center">
                <div className="text-6xl mb-4">🧙‍♂️</div>
                <h3 className="text-xl font-bold text-red-300 mb-2">Magic Failed!</h3>
                <p className="text-red-400 mb-6">{roadmapError}</p>
                <button
                  onClick={() => {
                    // If material isn't processed yet, show a helpful message
                    if (!materialProcessed) {
                      alert('Please wait for the learning material to finish processing first.');
                      return;
                    }
                    setIsGeneratingRoadmap(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full font-bold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🔮 Try the Magic Again
                </button>
              </div>
            ) : roadmap ? (
              <LearningRoadmapView
                sections={learningSections}
                onSectionSelect={handleSectionSelect}
                completedSections={completedSections}
                currentSectionId={currentSectionId ?? undefined}
                roadmapTitle={roadmap.title}
                roadmapDescription={roadmap.description}
                playerScore={playerScore}
              />
            ) : (
              <div className="p-6 text-center text-slate-400">
                <div className="text-4xl mb-4">🗺️</div>
                <p>No adventure map available</p>
                <button
                  onClick={() => {
                    if (!materialProcessed) {
                      alert('Please wait for the learning material to finish processing first.');
                      return;
                    }
                    setIsGeneratingRoadmap(true);
                  }}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-full font-bold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🚀 Create Adventure Map
                </button>
              </div>
            )}
          </div>
        )}

        {gameState === 'intro' && currentSection && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <IntroState 
              currentSection={currentSection}
              onStartReading={startReading}
              onReturnToRoadmap={handleReturnToRoadmap}
              isLoadingKeywords={isGeneratingKeywords}
            />
          </div>
        )}

        {gameState === 'reading' && currentSection && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <ReadingState 
              currentSection={currentSection}
              onTimerComplete={handleTimerComplete}
              additionalTime={isAdditionalReading && partialScoreData ? partialScoreData.additionalReadingTime : 0}
              isAdditionalReadingMode={isAdditionalReading}
            />
          </div>
        )}

        {gameState === 'challenge' && currentSection && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <ChallengeState 
              currentSection={currentSection}
              materialName={materialName}
              onChallengeComplete={handleChallengeComplete}
              onPartialScore={handlePartialScore}
              retryKey={retryKey}
            />
          </div>
        )}

        {gameState === 'partial-score' && partialScoreData && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <PartialScoreState 
              playerScore={partialScoreData.score}
              correctAnswers={partialScoreData.exerciseResults.correctAnswers}
              totalQuestions={partialScoreData.exerciseResults.totalQuestions}
              additionalReadingTime={partialScoreData.additionalReadingTime}
              onGoBackToReading={handleGoBackToReading}
            />
          </div>
        )}

        {gameState === 'reward' && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <RewardState onContinue={handleRewardContinue} />
          </div>
        )}

        {gameState === 'completed' && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <CompletedState 
              playerScore={playerScore}
              onReset={resetGame}
            />
          </div>
        )}
      </div>

      {/* AI Companion */}
      <div className="flex-shrink-0">
        <AICompanion
          context={{
            materialName,
            currentSectionId,
            gameState,
            playerScore,
            completedSectionIds: completedSections,
            totalSections: learningSections.length,
            selectedBlockId,
          }}
          currentSectionTitle={currentSection?.title}
          roadmapTitle={roadmap?.title}
          onClearSelectedBlock={onClearSelectedBlock}
        />
      </div>
    </div>
  );
}
