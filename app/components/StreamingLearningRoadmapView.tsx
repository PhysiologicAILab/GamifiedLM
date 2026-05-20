'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { LearningRoadmapSchema } from '../api/learning-materials/roadmap/schema';
import { useEffect } from 'react';

interface StreamingLearningRoadmapViewProps {
  materialName: string;
  onComplete?: (roadmap: any) => void;
  onError?: (error: Error) => void;
  playerScore?: number;
}

export default function StreamingLearningRoadmapView({
  materialName,
  onComplete,
  onError,
  playerScore = 0
}: StreamingLearningRoadmapViewProps) {
  const { object: roadmap, submit, isLoading, error, stop } = useObject({
    api: '/api/learning-materials/roadmap',
    schema: LearningRoadmapSchema,
    onFinish: async ({ object, error: validationError }) => {
      if (validationError) {
        console.error('Schema validation error:', validationError);
        onError?.(new Error('Invalid roadmap structure received'));
        return;
      }

      if (object) {
        try {
          // Save the completed roadmap to the file system
          const saveResponse = await fetch('/api/learning-materials/roadmap/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              materialName,
              roadmap: object
            })
          });

          if (!saveResponse.ok) {
            throw new Error('Failed to save roadmap');
          }

          const saveResult = await saveResponse.json();
          onComplete?.(saveResult.roadmap);
        } catch (saveError) {
          console.error('Error saving roadmap:', saveError);
          onError?.(saveError instanceof Error ? saveError : new Error('Unknown save error'));
        }
      }
    },
    onError: (fetchError) => {
      console.error('Roadmap generation error:', fetchError);
      onError?.(fetchError);
    },
  });

  // Auto-start generation when component mounts
  useEffect(() => {
    if (materialName && !isLoading && !roadmap && !error) {
      submit({ materialName });
    }
  }, [materialName, submit, isLoading, roadmap, error]);

  const getSectionTheme = (index: number) => {
    const themes = [
      {
        bg: 'from-green-400 to-emerald-500',
        icon: '🏠',
        terrain: 'Village',
        glow: 'shadow-green-500/30'
      },
      {
        bg: 'from-blue-400 to-cyan-500',
        icon: '🌊',
        terrain: 'River',
        glow: 'shadow-blue-500/30'
      },
      {
        bg: 'from-yellow-400 to-orange-500',
        icon: '🌲',
        terrain: 'Forest',
        glow: 'shadow-orange-500/30'
      },
      {
        bg: 'from-purple-400 to-pink-500',
        icon: '🌸',
        terrain: 'Garden',
        glow: 'shadow-purple-500/30'
      },
      {
        bg: 'from-red-500 to-purple-600',
        icon: '🏔️',
        terrain: 'Mountain',
        glow: 'shadow-red-500/30'
      },
      {
        bg: 'from-indigo-500 to-blue-600',
        icon: '🏰',
        terrain: 'Castle',
        glow: 'shadow-indigo-500/30'
      },
      {
        bg: 'from-teal-400 to-green-600',
        icon: '🌿',
        terrain: 'Grove',
        glow: 'shadow-teal-500/30'
      },
      {
        bg: 'from-orange-400 to-red-500',
        icon: '🔥',
        terrain: 'Volcano',
        glow: 'shadow-orange-500/30'
      }
    ];
    return themes[index % themes.length];
  };

  const getPathDirection = (index: number) => {
    const patterns = [
      { x: 50, curve: 'none' },
      { x: 65, curve: 'right' },
      { x: 35, curve: 'left' },
      { x: 60, curve: 'right' },
      { x: 40, curve: 'left' },
      { x: 67, curve: 'right' },
      { x: 33, curve: 'left' },
      { x: 55, curve: 'right' },
      { x: 45, curve: 'left' },
    ];
    return patterns[index % patterns.length];
  };

  const getProgressEmoji = () => {
    const subtaskCount = roadmap?.subtasks?.length || 0;
    if (subtaskCount >= 6) return '🔥';
    if (subtaskCount >= 3) return '⚡';
    return '🚀';
  };

  const getTotalTime = () => {
    return roadmap?.subtasks?.reduce((total, subtask) => 
      total + (subtask?.estimatedTime || 0), 0) || 0;
  };

  // Show error state
  if (error) {
    return (
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 mx-0 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Generation Failed</h2>
          <p className="text-slate-400 mb-4">Something went wrong while creating your learning adventure.</p>
          <button
            onClick={() => submit({ materialName })}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-2 mx-0 h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Integrated Header with Progress */}
        <div className="p-6 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl animate-bounce">{getProgressEmoji()}</span>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    {roadmap?.title || "Generating Learning Adventure..."}
                  </h1>
                  <p className="text-slate-300 text-lg max-w-2xl">
                    {roadmap?.description || "Creating your personalized learning journey..."}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl px-4 py-2 shadow-lg shadow-yellow-500/25">
                  <div className="text-white text-sm font-semibold">Total Score</div>
                  <div className="text-white text-2xl font-bold">{playerScore}</div>
                </div>
              </div>
            </div>

            {/* Loading or Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Adventure Stats */}
              <div className="flex justify-center lg:justify-start gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-purple-500/20 text-center">
                  <div className="text-purple-400 font-bold text-xl">
                    {roadmap?.subtasks?.length || 0}
                  </div>
                  <div className="text-slate-400 text-xs">🏰 Quests</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-green-500/20 text-center">
                  <div className="text-green-400 font-bold text-xl">
                    {getTotalTime()}min
                  </div>
                  <div className="text-slate-400 text-xs">⏳ Time</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-yellow-500/20 text-center">
                  <div className="text-yellow-400 font-bold text-xl">0</div>
                  <div className="text-slate-400 text-xs">🏆 Done</div>
                </div>
              </div>

              {/* Generation Status */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-semibold">
                    {isLoading ? '🎯 Generating...' : '🎯 Ready to Adventure!'}
                  </span>
                  {isLoading && (
                    <button
                      onClick={stop}
                      className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      Stop
                    </button>
                  )}
                </div>

                {isLoading && (
                  <div className="bg-slate-700/50 rounded-full h-4 overflow-hidden border border-slate-600/50 relative">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full animate-pulse rounded-full w-full">
                      <div className="absolute inset-0 bg-white/20 animate-ping rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Adventure Map */}
        <div className="relative max-w-5xl mx-auto px-4">
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 text-6xl transform rotate-12">🌟</div>
            <div className="absolute top-40 right-16 text-4xl transform -rotate-12">⚡</div>
            <div className="absolute bottom-32 left-20 text-5xl transform rotate-45">💎</div>
            <div className="absolute bottom-20 right-10 text-3xl transform -rotate-45">🔮</div>
          </div>

          {/* Adventure Path */}
          <div className="relative space-y-6">
            {/* Render existing subtasks */}
            {roadmap?.subtasks?.map((section, index) => {
              const theme = getSectionTheme(index);
              const pathDir = getPathDirection(index);

              return (
                <QuestNode
                  key={section?.id || `quest-${index}`}
                  section={section}
                  index={index}
                  theme={theme}
                  pathDir={pathDir}
                  isStreaming={false}
                />
              );
            })}

            {/* Show streaming placeholder only when actively loading */}
            {isLoading && (
              <QuestNode
                section={null}
                index={roadmap?.subtasks?.length || 0}
                theme={getSectionTheme(roadmap?.subtasks?.length || 0)}
                pathDir={getPathDirection(roadmap?.subtasks?.length || 0)}
                isStreaming={true}
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px) translateX(-50%);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Extracted QuestNode component for cleaner rendering
interface QuestNodeProps {
  section: any;
  index: number;
  theme: any;
  pathDir: any;
  isStreaming: boolean;
}

function QuestNode({ section, index, theme, pathDir, isStreaming }: QuestNodeProps) {
  return (
    <div
      className="relative w-full max-w-2xl animate-fade-in"
      style={{
        marginLeft: `${(pathDir.x - 50) * 0.6 + 50}%`,
        transform: 'translateX(-50%)',
        animationDelay: `${index * 200}ms`
      }}
    >
      {/* Path Connection */}
      {index > 0 && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-2 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full shadow-lg shadow-purple-500/50 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Quest Node */}
      <div className="relative group cursor-default transform transition-all duration-300">
        {/* Glow Effect */}
        <div className={`absolute -inset-4 bg-gradient-to-r ${theme.bg} opacity-30 rounded-full blur-xl transition-opacity duration-300 ${isStreaming ? 'animate-pulse' : ''}`}></div>

        {/* Main Quest Card */}
        <div className={`
          relative bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border-2 transition-all duration-300 w-full min-h-[160px]
          ${isStreaming ? 'border-slate-600/30 opacity-60' : 'border-purple-400/70 shadow-lg shadow-purple-500/30'}
          ${isStreaming ? 'animate-pulse' : ''}
        `}>
          {/* Quest Icon & Number */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold
                ${isStreaming ? 'bg-slate-700' : `bg-gradient-to-br ${theme.bg} ${theme.glow} shadow-lg`}
                ${isStreaming ? 'animate-pulse' : ''}
              `}>
                {isStreaming ? '⚡' : theme.icon}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full w-6 h-6 flex items-center justify-center border border-slate-600">
                <span className="text-xs font-bold text-slate-300">#{index + 1}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-xl leading-tight pr-4 text-purple-100">
                  {isStreaming ? (
                    <div className="h-6 bg-slate-700 rounded animate-pulse w-3/4"></div>
                  ) : (
                    section?.title || 'Generating quest...'
                  )}
                </h3>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {isStreaming ? (
                    <>
                      <div className="h-6 w-16 bg-slate-700 rounded-full animate-pulse"></div>
                      <div className="h-6 w-20 bg-slate-700 rounded-full animate-pulse"></div>
                    </>
                  ) : (
                    <>
                      <span className="px-3 py-1 text-xs font-bold rounded-full text-center bg-purple-500 text-white">
                        ⏱️ {section?.estimatedTime || '...'}min
                      </span>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${theme.bg} text-white text-center`}>
                        {theme.terrain}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-sm leading-relaxed text-purple-200">
                {isStreaming ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-700 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-slate-700 rounded animate-pulse w-2/3"></div>
                  </div>
                ) : (
                  section?.description || 'Crafting your adventure details...'
                )}
              </div>
            </div>
          </div>

          {/* Streaming Indicator */}
          {isStreaming && (
            <div className="absolute top-2 right-2 text-purple-400 text-xl animate-spin">
              ⚡
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

