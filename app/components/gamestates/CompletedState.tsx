'use client';

import { useState, useEffect } from 'react';

interface CompletedStateProps {
  playerScore: number;
  onReset: () => void;
}

export default function CompletedState({ playerScore, onReset }: CompletedStateProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);

  useEffect(() => {
    setShowCelebration(true);
    setTimeout(() => setAnimateScore(true), 800);
    
    return () => {
      setShowCelebration(false);
      setAnimateScore(false);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Celebration Background Effect */}
      {showCelebration && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            >
              {['🎓', '⭐', '🏆', '👑', '✨', '🎉', '💎'][Math.floor(Math.random() * 7)]}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-sm rounded-3xl p-8 border-2 border-yellow-400/50 max-w-lg w-full text-center relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-purple-500/20 animate-pulse" />
        
        <div className="relative z-10">
          {/* Graduation Cap Icon */}
          <div className="text-8xl mb-6 animate-bounce">
            🎓
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
            Learning Journey Complete!
          </h2>
          
          <p className="text-purple-200 text-xl mb-8">
            You've mastered the art of Thematic Analysis! 
            <br />
            <span className="text-yellow-300">Congratulations, Scholar!</span>
          </p>

          {/* Achievement Showcase */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-b from-yellow-400/20 to-orange-400/20 rounded-2xl p-4 border border-yellow-400/30">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm text-yellow-300 font-semibold">Master</div>
            </div>
            <div className="bg-gradient-to-b from-blue-400/20 to-indigo-400/20 rounded-2xl p-4 border border-blue-400/30">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-sm text-blue-300 font-semibold">Scholar</div>
            </div>
            <div className="bg-gradient-to-b from-green-400/20 to-emerald-400/20 rounded-2xl p-4 border border-green-400/30">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-sm text-green-300 font-semibold">Expert</div>
            </div>
          </div>

          {/* Final Score Display */}
          <div className={`bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl p-6 mb-8 transition-all duration-1000 ${animateScore ? 'scale-110' : 'scale-100'} shadow-2xl shadow-yellow-500/30`}>
            <div className="text-white text-xl font-bold mb-2">🌟 Final Score 🌟</div>
            <div className="text-5xl font-bold text-white">
              {playerScore} points
            </div>
            <div className="text-yellow-100 text-sm mt-2">
              Outstanding Achievement!
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/25 mb-4"
          >
            🔄 Start New Journey
          </button>

          {/* Motivational message */}
          <p className="text-slate-300 text-sm">
            Ready to explore new horizons? Your learning adventure awaits!
          </p>
        </div>
      </div>
    </div>
  );
}
