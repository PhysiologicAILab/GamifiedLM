'use client';

import { useState, useEffect } from 'react';
import { GameTimerProps } from './types';

export default function GameTimer({ duration, isActive, onTimeUp, onReset }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(duration);
    setIsRunning(isActive);
  }, [duration, isActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Handle timer completion separately to avoid setState during render
  useEffect(() => {
    if (timeLeft === 0 && isRunning === false) {
      onTimeUp();
    }
  }, [timeLeft, isRunning, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = ((duration - timeLeft) / duration) * 100;

  const getTimerColor = () => {
    if (timeLeft <= 10) return 'text-red-400';
    if (timeLeft <= 30) return 'text-orange-400';
    return 'text-green-400';
  };

  const getProgressColor = () => {
    if (timeLeft <= 10) return { from: 'red-500', to: 'red-600' };
    if (timeLeft <= 30) return { from: 'orange-500', to: 'orange-600' };
    return { from: 'green-500', to: 'green-600' };
  };

  const progressColors = getProgressColor();

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/50 relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 animate-pulse" />
      
      <div className="relative z-10">
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-300 mb-3">
            ⏰ Reading Challenge Timer
          </div>
          
          {/* Circular Progress */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-700"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={`rgb(${timeLeft <= 10 ? '239 68 68' : timeLeft <= 30 ? '249 115 22' : '34 197 94'})`} />
                  <stop offset="100%" stopColor={`rgb(${timeLeft <= 10 ? '220 38 38' : timeLeft <= 30 ? '234 88 12' : '22 163 74'})`} />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Timer display */}
            <div className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${getTimerColor()}`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Status */}
          <div className="text-xs text-slate-400 mb-4">
            {isRunning ? 'Time is ticking...' : timeLeft === 0 ? 'Time\'s up!' : 'Waiting to start...'}
          </div>

          {/* Reset button */}
          {onReset && !isRunning && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-indigo-500/25"
            >
              Reset Timer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
