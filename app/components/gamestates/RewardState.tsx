'use client';

import { useState, useEffect } from 'react';

interface RewardStateProps {
  onContinue: () => void;
  score?: number;
  timeBonus?: number;
}

export default function RewardState({ onContinue, score = 150, timeBonus = 0 }: RewardStateProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    setTimeout(() => setAnimateScore(true), 500);
    
    return () => {
      setShowConfetti(false);
      setAnimateScore(false);
    };
  }, []);

  const totalScore = score + timeBonus;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Confetti Background Effect */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['🎉', '⭐', '🏆', '💎', '✨'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-sm rounded-3xl p-8 border-2 border-purple-400/50 max-w-md w-full text-center relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 animate-pulse" />
        
        <div className="relative z-10">
          {/* Trophy Icon */}
          <div className="text-6xl mb-4 animate-bounce">
            🏆
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Challenge Complete!
          </h2>
          
          <p className="text-purple-200 mb-6">
            Outstanding work! You've mastered this section!
          </p>

          {/* Score Display */}
          <div className="space-y-4 mb-8">
            <div className={`bg-slate-800/50 rounded-2xl p-4 transition-all duration-1000 ${animateScore ? 'scale-105' : 'scale-100'}`}>
              <div className="text-sm text-slate-300 mb-2">Base Score</div>
              <div className="text-2xl font-bold text-green-400">
                +{score} points
              </div>
            </div>

            {timeBonus > 0 && (
              <div className={`bg-slate-800/50 rounded-2xl p-4 transition-all duration-1000 delay-300 ${animateScore ? 'scale-105' : 'scale-100'}`}>
                <div className="text-sm text-slate-300 mb-2">⚡ Time Bonus</div>
                <div className="text-2xl font-bold text-yellow-400">
                  +{timeBonus} points
                </div>
              </div>
            )}

            <div className={`bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 transition-all duration-1000 delay-500 ${animateScore ? 'scale-110' : 'scale-100'}`}>
              <div className="text-sm text-purple-200 mb-2">Total Score</div>
              <div className="text-3xl font-bold text-white">
                {totalScore} points
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="bg-yellow-500/20 rounded-full p-3 border border-yellow-400/30">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="bg-blue-500/20 rounded-full p-3 border border-blue-400/30">
              <span className="text-2xl">📚</span>
            </div>
            <div className="bg-green-500/20 rounded-full p-3 border border-green-400/30">
              <span className="text-2xl">⚡</span>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/25"
          >
            Continue Adventure! 🚀
          </button>

          {/* Motivational message */}
          <p className="text-slate-300 text-sm mt-4">
            Ready for the next challenge? Let's keep learning!
          </p>
        </div>
      </div>
    </div>
  );
}
