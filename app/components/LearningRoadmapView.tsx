'use client';

import { LearningRoadmapViewProps, LearningSection } from './types';

interface ExtendedLearningRoadmapViewProps extends LearningRoadmapViewProps {
  roadmapTitle?: string;
  roadmapDescription?: string;
  playerScore?: number;
}

export default function LearningRoadmapView({
  sections,
  onSectionSelect,
  completedSections,
  currentSectionId,
  roadmapTitle = "Learning Adventure Map",
  roadmapDescription = "Embark on an epic journey through the fascinating world of learning! Complete each quest to unlock the next adventure.",
  playerScore = 0
}: ExtendedLearningRoadmapViewProps) {
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

  const getSectionStatus = (sectionId: string) => {
    if (completedSections.includes(sectionId)) return 'completed';
    if (currentSectionId === sectionId) return 'active';
    return 'pending';
  };

  const getStatusIcon = (status: string, theme: any) => {
    switch (status) {
      case 'completed': return '🏆';
      case 'active': return '⚔️';
      default: return theme.icon;
    }
  };

  const getPathDirection = (index: number) => {
    // Create a winding path effect with more moderate offsets
    const patterns = [
      { x: 50, curve: 'none' },      // Center
      { x: 65, curve: 'right' },     // Moderate right
      { x: 35, curve: 'left' },      // Moderate left
      { x: 60, curve: 'right' },     // Light right
      { x: 40, curve: 'left' },      // Light left
      { x: 67, curve: 'right' },     // Moderate right
      { x: 33, curve: 'left' },      // Moderate left
      { x: 55, curve: 'right' },     // Light right
      { x: 45, curve: 'left' },      // Light left
    ];
    return patterns[index % patterns.length];
  };

  // Calculate total estimated time and progress
  const totalTime = sections.reduce((sum, section) => sum + section.estimatedTime, 0);
  const progress = sections.length > 0 ? (completedSections.length / sections.length) * 100 : 0;

  const getProgressColor = () => {
    if (progress >= 80) return 'from-green-500 to-emerald-500';
    if (progress >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-purple-500 to-indigo-500';
  };

  const getProgressEmoji = () => {
    if (progress >= 100) return '👑';
    if (progress >= 80) return '🔥';
    if (progress >= 50) return '⚡';
    return '🚀';
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-2 mx-0 h-full flex flex-col overflow-hidden">
      {/* Scrollable Content Container */}
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
                    {roadmapTitle}
                  </h1>
                  <p className="text-slate-300 text-lg max-w-2xl">
                    {roadmapDescription}
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

            {/* Stats and Progress Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Adventure Stats */}
              <div className="flex justify-center lg:justify-start gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-purple-500/20 text-center">
                  <div className="text-purple-400 font-bold text-xl">{sections.length}</div>
                  <div className="text-slate-400 text-xs">🏰 Quests</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-green-500/20 text-center">
                  <div className="text-green-400 font-bold text-xl">{totalTime}min</div>
                  <div className="text-slate-400 text-xs">⏳ Time</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-yellow-500/20 text-center">
                  <div className="text-yellow-400 font-bold text-xl">{completedSections.length}</div>
                  <div className="text-slate-400 text-xs">🏆 Done</div>
                </div>
              </div>

              {/* Enhanced Progress Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-semibold">
                    🎯 Progress: {completedSections.length} / {sections.length}
                  </span>
                  <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    {Math.round(progress)}%
                  </span>
                </div>

                {/* Enhanced Progress bar */}
                <div className="bg-slate-700/50 rounded-full h-4 overflow-hidden border border-slate-600/50 relative">
                  <div
                    className={`bg-gradient-to-r ${getProgressColor()} h-full transition-all duration-1000 ease-out relative`}
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                  </div>
                  {progress > 0 && (
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 text-white text-xs font-bold"
                      style={{ left: `${Math.max(progress - 15, 5)}%` }}
                    >
                      {progress >= 15 && `${Math.round(progress)}%`}
                    </div>
                  )}
                </div>

                {/* Simplified Milestones */}
                <div className="flex justify-between text-xs">
                  <div className={`flex items-center gap-1 ${progress >= 25 ? 'text-green-400' : 'text-slate-500'}`}>
                    <span>{progress >= 25 ? '✅' : '⭕'}</span>
                    <span>25%</span>
                  </div>
                  <div className={`flex items-center gap-1 ${progress >= 50 ? 'text-yellow-400' : 'text-slate-500'}`}>
                    <span>{progress >= 50 ? '✅' : '⭕'}</span>
                    <span>50%</span>
                  </div>
                  <div className={`flex items-center gap-1 ${progress >= 75 ? 'text-orange-400' : 'text-slate-500'}`}>
                    <span>{progress >= 75 ? '✅' : '⭕'}</span>
                    <span>75%</span>
                  </div>
                  <div className={`flex items-center gap-1 ${progress >= 100 ? 'text-purple-400' : 'text-slate-500'}`}>
                    <span>{progress >= 100 ? '✅' : '⭕'}</span>
                    <span>100%</span>
                  </div>
                </div>
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
          {sections.map((section, index) => {
            const status = getSectionStatus(section.id);
            const theme = getSectionTheme(index);
            const pathDir = getPathDirection(index);
            const isCompleted = status === 'completed';
            const isActive = status === 'active';
            const isLocked = !isCompleted && !isActive && index > 0 && !completedSections.includes(sections[index - 1].id);

            return (
              <div
                key={section.id}
                className="relative w-full max-w-2xl"
                style={{
                  marginLeft: `${(pathDir.x - 50) * 0.6 + 50}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {/* Path Connection */}
                {index > 0 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                    <div className={`w-2 h-6 bg-gradient-to-b rounded-full ${isCompleted || completedSections.includes(sections[index - 1].id)
                        ? 'from-purple-400 to-pink-400 shadow-lg shadow-purple-500/50'
                        : 'from-slate-600 to-slate-700'
                      } relative`}>
                      {(isCompleted || completedSections.includes(sections[index - 1].id)) && (
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quest Node */}
                <div
                  onClick={() => !isLocked && onSectionSelect(section)}
                  className={`
                    relative group cursor-pointer transform transition-all duration-300 hover:scale-105
                    ${isLocked ? 'cursor-not-allowed opacity-50' : ''}
                    ${isActive ? 'animate-pulse' : ''}
                  `}
                >
                  {/* Glow Effect */}
                  <div className={`absolute -inset-4 bg-gradient-to-r ${theme.bg} opacity-20 rounded-full blur-xl transition-opacity duration-300 ${isCompleted ? 'opacity-40' : isActive ? 'opacity-30 animate-pulse' : 'group-hover:opacity-30'
                    }`}></div>

                  {/* Main Quest Card */}
                  <div className={`
                    relative bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border-2 transition-all duration-300 w-full min-h-[160px]
                    ${isCompleted
                      ? 'border-green-400/50 shadow-lg shadow-green-500/20'
                      : isActive
                        ? 'border-purple-400/70 shadow-lg shadow-purple-500/30'
                        : isLocked
                          ? 'border-slate-600/30'
                          : 'border-slate-600/50 hover:border-slate-500/70'
                    }
                    ${!isLocked && 'hover:shadow-xl hover:shadow-purple-500/20'}
                  `}>

                    {/* Quest Icon & Number */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <div className={`
                          w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold
                          bg-gradient-to-br ${theme.bg} ${theme.glow} shadow-lg
                          ${isActive ? 'animate-bounce' : ''}
                          ${isLocked ? 'grayscale' : ''}
                        `}>
                          {isLocked ? '🔒' : getStatusIcon(status, theme)}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full w-6 h-6 flex items-center justify-center border border-slate-600">
                          <span className="text-xs font-bold text-slate-300">#{index + 1}</span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className={`font-bold text-xl leading-tight pr-4 ${isCompleted ? 'text-green-100' : isActive ? 'text-purple-100' : isLocked ? 'text-slate-500' : 'text-slate-200'
                            }`}>
                            {section.title}
                          </h3>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full text-center ${isCompleted ? 'bg-green-500 text-white' :
                                isActive ? 'bg-purple-500 text-white animate-pulse' :
                                  'bg-slate-600 text-slate-300'
                              }`}>
                              ⏱️ {section.estimatedTime}min
                            </span>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${theme.bg} text-white text-center ${isLocked ? 'opacity-50' : ''
                              }`}>
                              {theme.terrain}
                            </span>
                          </div>
                        </div>

                        <p className={`text-sm leading-relaxed ${isCompleted ? 'text-green-200' : isActive ? 'text-purple-200' : isLocked ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                          {section.description}
                        </p>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 text-green-400 text-xl animate-pulse">
                        ✅
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute top-2 right-2 text-purple-400 text-xl animate-spin">
                        ⚡
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl mb-2">🔒</div>
                          <p className="text-slate-400 text-sm">Complete previous quest first</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Achievement Celebration */}
        {completedSections.length > 0 && (
          <div className="mt-12 mb-3 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 rounded-3xl p-8 border border-purple-500/30 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 animate-pulse"></div>
              <div className="relative text-center">
                <div className="text-5xl mb-4 animate-bounce">🏆</div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">
                  Legendary Progress!
                </h3>
                <p className="text-purple-200 text-lg mb-4">
                  You've conquered {completedSections.length} out of {sections.length} quests!
                </p>
                <div className="flex justify-center gap-4 text-sm">
                  <span className="px-4 py-2 bg-purple-500/30 rounded-full text-purple-200">
                    🔥 {Math.round((completedSections.length / sections.length) * 100)}% Complete
                  </span>
                  <span className="px-4 py-2 bg-pink-500/30 rounded-full text-pink-200">
                    ⚡ Keep the momentum!
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Achievement */}
        {completedSections.length === sections.length && (
          <div className="mt-8 mb-3 text-center">
            <div className="text-6xl mb-4 animate-pulse">👑</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mb-2">
              Quest Master!
            </h2>
            <p className="text-yellow-200 text-lg">
              You've completed the entire adventure! You are now a master of this domain! 🎉
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
