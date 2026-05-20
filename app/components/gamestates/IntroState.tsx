'use client';

import { LearningSection } from '../types';

interface IntroStateProps {
  currentSection: LearningSection;
  onStartReading: () => void;
  onReturnToRoadmap: () => void;
  isLoadingKeywords?: boolean;
}

export default function IntroState({ currentSection, onStartReading, onReturnToRoadmap, isLoadingKeywords = false }: IntroStateProps) {

  return (
    <div className="text-center space-y-6">
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-600/50 relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 animate-pulse" />

        <div className="relative z-10">
          {/* Section Icon */}
          <div className="text-5xl mb-4 animate-bounce">
            📚
          </div>

          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            {currentSection.title}
          </h3>

          <p className="text-slate-300 text-lg mb-6 leading-relaxed">
            {currentSection.description}
          </p>

          {/* Enhanced badges */}
          <div className="flex justify-center gap-4 text-sm mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 rounded-full border border-purple-400/30 backdrop-blur-sm">
              ⏱️ {currentSection.estimatedTime} minutes
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onReturnToRoadmap}
              className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-slate-500/25 flex items-center justify-center gap-2"
            >
              ← Back to Roadmap
            </button>

            <button
              onClick={onStartReading}
              disabled={isLoadingKeywords}
              className={`px-8 py-4 font-bold rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                isLoadingKeywords 
                  ? 'bg-gradient-to-r from-slate-500 to-slate-600 cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 shadow-green-500/25'
              }`}
            >
              {isLoadingKeywords ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Loading Keywords...
                </>
              ) : (
                <>
                  🚀 Start The Task!
                </>
              )}
            </button>
          </div>
        </div>
      </div>


    </div>
  );
}
