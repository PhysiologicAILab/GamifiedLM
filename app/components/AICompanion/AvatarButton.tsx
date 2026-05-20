import type { GeneratedCharacter } from '../types';
import { LoadingTooltip, HintTooltip } from './Tooltip';

interface AvatarButtonProps {
  isExpanded: boolean;
  currentCharacter: GeneratedCharacter | null;
  availableCharacters: GeneratedCharacter[];
  isLoading: boolean;
  onToggleExpanded: () => void;
}

export default function AvatarButton({
  isExpanded,
  currentCharacter,
  availableCharacters,
  isLoading,
  onToggleExpanded
}: AvatarButtonProps) {
  if (isExpanded) return null;

  return (
    <div className="absolute bottom-4 left-4 z-50">
      <div
        className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-all duration-200 flex items-center justify-center relative"
        onClick={onToggleExpanded}
        title={isLoading ? "Loading companions..." : (availableCharacters.length === 0 ? "Create your AI companion" : "Chat with your AI companion")}
      >
        {currentCharacter?.avatarPath ? (
          <img 
            src={`/api/companions/${currentCharacter.id}/avatar`} 
            alt={`${currentCharacter.name} avatar`}
            className="w-20 h-20 rounded-full object-cover"
            onError={(e) => {
              // Fallback to emoji if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`text-white text-2xl ${currentCharacter?.avatarPath ? 'hidden' : ''}`}>
          {isLoading ? (
            <div className="animate-spin">⏳</div>
          ) : (
            currentCharacter?.avatar || (availableCharacters.length === 0 ? '➕' : '🤖')
          )}
        </div>
        {/* Pulse animation */}
        <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-30"></div>
      </div>
      
      {/* Loading tooltip */}
      {isLoading && <LoadingTooltip />}
      
      {/* Hint tooltip for no characters - only show when not loading */}
      {!isLoading && availableCharacters.length === 0 && (
        <HintTooltip message="Create your AI companion" />
      )}
    </div>
  );
}

