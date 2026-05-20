import type { GeneratedCharacter } from '../types';

interface CharacterCardProps {
  character: GeneratedCharacter;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: (character: GeneratedCharacter) => void;
  showEditButton?: boolean;
}

export default function CharacterCard({
  character,
  isSelected = false,
  onClick,
  onEdit,
  showEditButton = false
}: CharacterCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
        isSelected
          ? 'ring-2 ring-purple-400 shadow-2xl shadow-purple-500/25'
          : 'hover:shadow-xl hover:shadow-slate-900/50'
      }`}
    >
      {/* Main Card Container */}
      <div className="relative flex min-h-[180px]">
        {/* Avatar Section with Fade Effect */}
        <div className="relative w-48 flex-shrink-0">
          {/* Avatar Content - Full Size */}
          <div className="relative h-full">
            {character.avatarPath ? (
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={character.avatarPath}
                  alt={character.name}
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
                {/* Natural fade-out overlay that matches the background */}
                <div className={`absolute inset-0 transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-r from-transparent from-40% via-purple-600/30 via-70% to-purple-600'
                    : 'bg-gradient-to-r from-transparent from-40% via-slate-600/40 via-70% to-slate-600 group-hover:via-slate-500/50 group-hover:to-slate-500'
                }`} />
                <div className="hidden w-full h-full items-center justify-center text-8xl">
                  <div className={`transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-transparent from-40% via-purple-600/30 via-70% to-purple-600'
                      : 'bg-gradient-to-r from-transparent from-40% via-slate-600/40 via-70% to-slate-600 group-hover:via-slate-500/50 group-hover:to-slate-500'
                  } w-full h-full flex items-center justify-center`}>
                    {character.avatar}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Emoji background */}
                <div className="absolute inset-0 flex items-center justify-center text-8xl">
                  {character.avatar}
                </div>
                {/* Natural fade-out overlay that matches the background */}
                <div className={`absolute inset-0 transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-r from-transparent from-40% via-purple-600/30 via-70% to-purple-600'
                    : 'bg-gradient-to-r from-transparent from-40% via-slate-600/40 via-70% to-slate-600 group-hover:via-slate-500/50 group-hover:to-slate-500'
                }`} />
              </div>
            )}

            {/* Edit Button */}
            {showEditButton && onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(character);
                }}
                className="absolute cursor-pointer top-3 left-3 w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-lg z-20 opacity-0 group-hover:opacity-100"
                title="Edit character"
              >
                ✏️
              </button>
            )}
          </div>
        </div>
        
        {/* Character Info Section */}
        <div className={`flex-1 relative transition-all duration-300 ${
          isSelected
            ? 'bg-gradient-to-r from-purple-600 from-0% via-purple-600/40 via-30% to-purple-600/20'
            : 'bg-gradient-to-r from-slate-600 from-0% via-slate-600/50 via-30% to-slate-600/20 group-hover:from-slate-500 group-hover:via-slate-500/60 group-hover:to-slate-500/30'
        }`}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-6 flex flex-col justify-center h-full">
            <div className="mb-4">
              <h3 className="font-bold text-2xl text-white mb-2 truncate">
                {character.name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-white/90">
                <span className="px-3 py-1 bg-white/15 rounded-full text-sm font-medium backdrop-blur-sm">
                  {character.identity.name}
                </span>
                <span className="text-white/60">•</span>
                <span className="text-sm font-medium">
                  {character.personality.trait}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-white/80 line-clamp-2 leading-relaxed">
                {character.greeting}
              </p>
              
              <div className="flex items-center justify-between text-xs text-white/60">
                <div>
                  Created: {new Date(character.createdAt).toLocaleDateString()}
                </div>
                {character.lastUsed && (
                  <div>
                    Last used: {new Date(character.lastUsed).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Selection Glow Effect */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-indigo-400/10 animate-pulse rounded-2xl" />
      )}
    </div>
  );
}
