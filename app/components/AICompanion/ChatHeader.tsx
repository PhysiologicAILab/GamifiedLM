import type { GeneratedCharacter } from '../types';

interface ChatHeaderProps {
  currentCharacter: GeneratedCharacter | null;
  availableCharacters: GeneratedCharacter[];
  onMouseDown: (e: React.MouseEvent) => void;
  onAvatarClick: (e: React.MouseEvent) => void;
  onClose: () => void;
}

export default function ChatHeader({
  currentCharacter,
  availableCharacters,
  onMouseDown,
  onAvatarClick,
  onClose
}: ChatHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-800/90 via-purple-700/90 to-indigo-800/90 rounded-t-2xl relative overflow-hidden backdrop-blur-sm border-b border-purple-600/30">
      {/* Character Card Style Avatar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-32 cursor-pointer group"
        onClick={onAvatarClick}
        title="Click to open character settings"
      >
        {/* Avatar Section with Fade Effect */}
        <div className="relative w-full h-full">
          {currentCharacter?.avatarPath ? (
            <div className="relative w-full h-full overflow-hidden rounded-tl-2xl">
              <img
                src={`/api/companions/${currentCharacter.id}/avatar`}
                alt={currentCharacter.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallbackDiv = target.nextElementSibling as HTMLElement;
                  if (fallbackDiv) {
                    fallbackDiv.classList.remove('hidden');
                    fallbackDiv.classList.add('flex');
                  }
                }}
              />
               {/* Fade-out overlay to blend with solid purple background */}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent from-40% via-purple-800/30 via-70% to-purple-800 transition-all duration-300 group-hover:via-purple-500/40 group-hover:to-purple-500" />
               <div className="hidden w-full h-full items-center justify-center text-6xl rounded-tl-2xl">
                 <div className="bg-gradient-to-r from-transparent from-40% via-purple-800/30 via-70% to-purple-800 group-hover:via-purple-500/40 group-hover:to-purple-500 w-full h-full flex items-center justify-center transition-all duration-300">
                   {currentCharacter.avatar}
                 </div>
               </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center rounded-tl-2xl">
              {/* Emoji background */}
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                {currentCharacter?.avatar || (availableCharacters.length === 0 ? '➕' : '🤖')}
              </div>
               {/* Fade-out overlay to blend with solid purple background */}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent from-40% via-purple-800/30 via-70% to-purple-800 transition-all duration-300 group-hover:via-purple-500/40 group-hover:to-purple-500" />
            </div>
          )}

          {/* Settings Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 rounded-tl-2xl">
            <div className="w-8 h-8 bg-white/90 hover:bg-white text-purple-800 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-lg">
              ⚙️
            </div>
          </div>
        </div>
      </div>
      
      <div
        className="flex items-center justify-between p-2 pl-36 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0 relative">
            {/* Main title with enhanced styling */}
            <div className="relative">
              <div className="font-bold text-lg truncate drop-shadow-lg bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent animate-pulse-subtle">
                {currentCharacter?.name || (availableCharacters.length === 0 ? 'Create Your Character' : 'AI Companion')}
              </div>
              {/* Text glow effect */}
              <div className="absolute inset-0 text-white/20 font-bold text-lg truncate blur-sm">
                {currentCharacter?.name || (availableCharacters.length === 0 ? 'Create Your Character' : 'AI Companion')}
              </div>
            </div>
            
            {/* Subtitle with enhanced styling */}
            {currentCharacter ? (
              <div className="relative mt-1">
                <div className="text-sm truncate font-medium drop-shadow-md bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  ✨ {currentCharacter.identity.name}
                </div>
                {/* Subtitle glow */}
                <div className="absolute inset-0 text-white/10 text-sm truncate blur-sm">
                  ✨ {currentCharacter.identity.name}
                </div>
              </div>
            ) : availableCharacters.length === 0 ? (
              <div className="relative mt-1">
                <div className="text-sm truncate font-medium drop-shadow-md bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200 bg-clip-text text-transparent animate-pulse">
                  🎭 Personalize your learning experience
                </div>
                {/* Subtitle glow */}
                <div className="absolute inset-0 text-white/10 text-sm truncate blur-sm">
                  🎭 Personalize your learning experience
                </div>
              </div>
            ) : null}
          </div>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

