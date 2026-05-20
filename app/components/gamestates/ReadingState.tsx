'use client';

import { LearningSection } from '../types';
import GameTimer from '../GameTimer';

interface ReadingStateProps {
  currentSection: LearningSection;
  onTimerComplete: () => void;
  additionalTime?: number; // Additional time in seconds for partial score scenarios
  isAdditionalReadingMode?: boolean; // Whether this is additional reading after partial score
}

export default function ReadingState({ currentSection, onTimerComplete, additionalTime = 0, isAdditionalReadingMode = false }: ReadingStateProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg">
      <div className="space-y-6">
        {/* Timer Block */}
        <div>
          <GameTimer
            duration={isAdditionalReadingMode ? additionalTime : currentSection.estimatedTime * 60}
            isActive={true}
            onTimeUp={onTimerComplete}
          />
          {isAdditionalReadingMode && additionalTime > 0 && (
            <div className="mt-4 bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
              <div className="text-blue-300 text-sm font-semibold mb-2">
                📚 Additional Study Time
              </div>
              <div className="text-blue-200 text-sm">
                Focus time: {Math.ceil(additionalTime / 60)} minute{Math.ceil(additionalTime / 60) !== 1 ? 's' : ''} to strengthen your understanding of the areas you missed!
              </div>
            </div>
          )}
        </div>

        {/* Content Section Block */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📖</span>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {currentSection.title}
            </h3>
          </div>
          
          <p className="text-slate-200 leading-relaxed">
            {isAdditionalReadingMode 
              ? `Review and strengthen your understanding of the "${currentSection.title}" section. Focus on the areas you found challenging in the quiz.`
              : `Focus on the highlighted section in the learning material. The "${currentSection.title}" section is now highlighted for your attention.`
            }
          </p>
        </div>
        
        {/* Action Button Block */}
        <div className="text-center">
          <div className="space-y-4">
            <button
              onClick={onTimerComplete}
              className={`px-8 py-4 bg-gradient-to-r ${
                isAdditionalReadingMode 
                  ? 'from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/25' 
                  : 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/25'
              } text-white font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg`}
            >
              {isAdditionalReadingMode ? '🎯 Ready to Try Again!' : '⚡ I\'m Ready for the Challenge!'}
            </button>
            <p className="text-slate-400 text-sm">
              {isAdditionalReadingMode 
                ? 'Finish reviewing early and retake the quiz' 
                : 'Finish reading early and proceed to the quiz'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
