import { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  className?: string;
}

export function Tooltip({ children, className = '' }: TooltipProps) {
  return (
    <div className={`absolute -top-4 left-full ml-4 animate-fade-in z-[99999] ${className}`}>
      <div className="relative bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-purple-900/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-900/25 px-4 py-3 whitespace-nowrap">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-indigo-500/10 animate-pulse rounded-xl pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2 text-sm text-white">
          {children}
        </div>
        
        {/* Arrow pointer - pointing to the left towards the button */}
        <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-gradient-to-br from-slate-800/95 to-purple-900/95 border-l border-b border-purple-500/30 rotate-45"></div>
        </div>
      </div>
    </div>
  );
}

interface LoadingTooltipProps {
  message?: string;
  className?: string;
}

export function LoadingTooltip({ message = "Loading companions...", className }: LoadingTooltipProps) {
  return (
    <Tooltip className={className}>
      <div className="w-4 h-4 border-2 border-purple-400/50 border-t-purple-400 rounded-full animate-spin"></div>
      <span className="font-medium">{message}</span>
    </Tooltip>
  );
}

interface HintTooltipProps {
  icon?: string;
  message: string;
  className?: string;
}

export function HintTooltip({ icon = "✨", message, className }: HintTooltipProps) {
  return (
    <Tooltip className={className}>
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{message}</span>
    </Tooltip>
  );
}
