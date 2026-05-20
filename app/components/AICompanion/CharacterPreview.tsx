import { getGuidingStyleIcon } from '../utils/characterUtils';
import type { GeneratedCharacter, CharacterCustomization } from '../types';

interface CharacterPreviewProps {
  character: GeneratedCharacter;
  customization: CharacterCustomization;
  onBack: () => void;
}

export default function CharacterPreview({
  character,
  customization,
  onBack
}: CharacterPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Character Card View */}
      <div className="relative">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Back to Character List
        </button>

        {/* Character Preview Card - Full Width */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-[1.01] mb-6">
          {/* Main Card Container */}
          <div className="relative flex min-h-[240px]">
            {/* Avatar Section with Fade Effect */}
            <div className="relative w-64 flex-shrink-0">
              {/* Avatar Content - Full Size */}
              <div className="relative h-full">
                {character.avatarPath ? (
                  <div className="relative w-full h-full overflow-hidden">
                    <img
                      src={`/api/companions/${character.id}/avatar`}
                      alt={customization.name}
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
                    <div className="absolute inset-0 transition-all duration-500 bg-gradient-to-r from-transparent from-40% via-purple-600/30 via-70% to-purple-600" />
                    <div className="hidden w-full h-full items-center justify-center text-8xl">
                      <div className="transition-all duration-500 bg-gradient-to-r from-transparent from-40% via-purple-600/30 via-70% to-purple-600 w-full h-full flex items-center justify-center">
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
                    <div className="absolute inset-0 transition-all duration-500 bg-gradient-to-r from-transparent from-40% via-purple-600/30 via-70% to-purple-600" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Character Info Section - Full Width */}
            <div className="flex-1 relative transition-all duration-500 bg-gradient-to-r from-purple-600 from-0% via-purple-600/40 via-30% to-purple-600/20">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col justify-center h-full">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-bold text-3xl text-white truncate">
                      {customization.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/90 mb-4">
                    <span className="px-4 py-2 bg-white/15 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-2">
                      <span className="text-lg">{customization.identity.emoji}</span>
                      {customization.identity.name}
                    </span>
                    <span className="text-white/60">•</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                      {customization.personality.trait}
                    </span>
                    <span className="text-white/60">•</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span className="text-lg">{getGuidingStyleIcon(customization.guidingStyle.name)}</span>
                      {customization.guidingStyle.name}
                    </span>
                  </div>
                </div>
                
                {/* Stats Grid - Vertical Layout */}
                <div className="grid grid-cols-1 gap-4 mb-4">
                  {/* Personality */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Personality</span>
                    </div>
                    <p className="text-white font-medium text-sm mb-1">{customization.personality.trait}</p>
                    <p className="text-white/70 text-xs leading-relaxed">{customization.personality.description}</p>
                  </div>

                  {/* Teaching Style */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getGuidingStyleIcon(customization.guidingStyle.name)}</span>
                      <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Teaching Style</span>
                    </div>
                    <p className="text-white font-medium text-sm mb-1">{customization.guidingStyle.name}</p>
                    <p className="text-white/70 text-xs leading-relaxed">{customization.guidingStyle.description}</p>
                  </div>

                  {/* Additional Traits */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌟</span>
                      <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Special Traits</span>
                    </div>
                    {customization.additionalTraits && customization.additionalTraits.trim().length > 0 ? (
                      <p className="text-white/70 text-xs leading-relaxed line-clamp-3">
                        {customization.additionalTraits}
                      </p>
                    ) : (
                      <p className="text-white/50 text-xs italic">
                        No additional traits specified
                      </p>
                    )}
                  </div>
                </div>
                {/* Quick Stats */}
                <div className="flex items-center justify-between text-xs text-white/60">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span>📅</span>
                      <span>Created: {new Date(character.createdAt).toLocaleDateString()}</span>
                    </div>
                    {character.lastUsed && (
                      <div className="flex items-center gap-1">
                        <span>🕒</span>
                        <span>Last selected: {new Date(character.lastUsed).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Selection Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-indigo-400/10 animate-pulse rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
