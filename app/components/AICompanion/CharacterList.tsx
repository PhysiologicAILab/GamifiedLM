import CharacterCard from './CharacterCard';
import type { GeneratedCharacter } from '../types';

interface CharacterListProps {
  characters: GeneratedCharacter[];
  selectedCharacterId: string;
  onCharacterSelect: (characterId: string) => void;
  onCharacterEdit: (character: GeneratedCharacter) => void;
  onSelectCharacter: () => void;
  onCreateNew: () => void;
}

export default function CharacterList({
  characters,
  selectedCharacterId,
  onCharacterSelect,
  onCharacterEdit,
  onSelectCharacter,
  onCreateNew
}: CharacterListProps) {
  if (characters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-xl font-medium text-slate-200 mb-2">No Characters Yet</h3>
          <p className="text-slate-400">Create your first character to get started!</p>
          <button
            onClick={onCreateNew}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Create Character
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full">
      <div className="space-y-4">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isSelected={selectedCharacterId === character.id}
            onClick={() => onCharacterSelect(character.id)}
            onEdit={onCharacterEdit}
            showEditButton={true}
          />
        ))}
      </div>

      {selectedCharacterId && (
        <div className="flex justify-end pt-4">
          <button
            onClick={onSelectCharacter}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
          >
            Select This Character
          </button>
        </div>
      )}
    </div>
  );
}
