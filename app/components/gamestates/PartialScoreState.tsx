'use client';

import { useState, useEffect } from 'react';

interface PartialScoreStateProps {
  playerScore: number;
  correctAnswers: number;
  totalQuestions: number;
  additionalReadingTime: number; // in seconds
  onGoBackToReading: () => void;
}

export default function PartialScoreState({ 
  playerScore, 
  correctAnswers, 
  totalQuestions, 
  additionalReadingTime,
  onGoBackToReading 
}: PartialScoreStateProps) {
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);

  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const wrongPercentage = 100 - percentage;
  
  // Convert seconds to minutes and seconds for display
  const minutes = Math.floor(additionalReadingTime / 60);
  const seconds = additionalReadingTime % 60;
  
  const formatTime = () => {
    if (minutes > 0 && seconds > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  };

  useEffect(() => {
    setShowEncouragement(true);
    setTimeout(() => setAnimateScore(true), 800);
    
    return () => {
      setShowEncouragement(false);
      setAnimateScore(false);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Floating motivation particles */}
      {showEncouragement && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['📚', '💪', '🎯', '⚡', '🚀', '💡'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800/95 to-blue-900/95 backdrop-blur-sm rounded-3xl p-8 border-2 border-slate-400/50 max-w-lg w-full text-center relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/20 to-blue-500/20 animate-pulse" />
        
        <div className="relative z-10">
          {/* Study Icon */}
          <div className="text-8xl mb-6 animate-bounce">
            📚
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-300 to-blue-300 bg-clip-text text-transparent mb-4">
            Great Progress!
          </h2>
          
          <p className="text-slate-200 text-xl mb-6">
            You're on the right track, but let's aim for mastery!
            <br />
            <span className="text-blue-300">Knowledge is power! 💪</span>
          </p>

          {/* Score Display */}
          <div className={`bg-gradient-to-r from-slate-600/30 to-blue-600/30 rounded-3xl p-6 mb-6 transition-all duration-1000 ${animateScore ? 'scale-105' : 'scale-100'} border border-slate-400/30`}>
            <div className="text-slate-200 text-lg font-semibold mb-3">📊 Your Performance</div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-2xl p-4">
                <div className="text-2xl font-bold text-slate-200">{percentage}%</div>
                <div className="text-slate-400 text-sm">Score</div>
              </div>
              <div className="bg-slate-700/50 rounded-2xl p-4">
                <div className="text-2xl font-bold text-slate-200">{correctAnswers}/{totalQuestions}</div>
                <div className="text-slate-400 text-sm">Correct</div>
              </div>
            </div>
            <div className="text-slate-300 text-lg font-semibold">
              {playerScore} points earned
            </div>
          </div>

          {/* Encouragement Message */}
          <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl p-6 mb-6 border border-blue-400/30">
            <div className="text-blue-300 text-lg font-semibold mb-3">
              🎯 Path to Mastery
            </div>
            <p className="text-blue-200 text-base leading-relaxed mb-4">
              You got {wrongPercentage}% of questions wrong. Let's spend some extra time reviewing the material to ensure you truly master these concepts!
            </p>
            <div className="bg-blue-600/20 rounded-xl p-4 border border-blue-400/20">
              <div className="text-blue-300 font-semibold text-sm mb-1">
                ⏰ Additional Reading Time
              </div>
              <div className="text-2xl font-bold text-blue-200">
                {formatTime()}
              </div>
              <div className="text-blue-300 text-sm mt-1">
                Based on areas that need attention
              </div>
            </div>
          </div>

          {/* Go Back Button */}
          <button
            onClick={onGoBackToReading}
            className="w-full py-4 bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-slate-500/25 mb-4"
          >
            📖 Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
