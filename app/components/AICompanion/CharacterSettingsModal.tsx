import { useState, useEffect } from 'react';
import CharacterList from './CharacterList';
import CharacterCustomizationForm from './CharacterCustomizationForm';
import CharacterPreview from './CharacterPreview';
import type {
  CharacterSettingsProps,
  CharacterCustomization,
  CharacterPersonality,
  CharacterIdentity,
  CharacterGuidingStyle,
  GeneratedCharacter
} from '../types';

export default function CharacterSettingsModal({
  isOpen,
  onClose,
  onCharacterGenerated,
}: CharacterSettingsProps) {
  // Configuration data from API
  const [personalityTraits, setPersonalityTraits] = useState<CharacterPersonality[]>([]);
  const [characterIdentities, setCharacterIdentities] = useState<CharacterIdentity[]>([]);
  const [guidingStyles, setGuidingStyles] = useState<CharacterGuidingStyle[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  const [customization, setCustomization] = useState<CharacterCustomization>({
    name: '',
    personality: {} as CharacterPersonality,
    guidingStyle: {} as CharacterGuidingStyle,
    identity: {} as CharacterIdentity,
    additionalTraits: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [existingCharacters, setExistingCharacters] = useState<GeneratedCharacter[]>([]);
  const [selectedExistingCharacter, setSelectedExistingCharacter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'create' | 'select'>('select');
  const [editingCharacter, setEditingCharacter] = useState<GeneratedCharacter | null>(null);
  const [editingCustomization, setEditingCustomization] = useState<CharacterCustomization>({
    name: '',
    personality: {} as CharacterPersonality,
    guidingStyle: {} as CharacterGuidingStyle,
    identity: {} as CharacterIdentity,
    additionalTraits: ''
  });

  // Load configuration data and existing characters
  useEffect(() => {
    if (isOpen) {
      loadCharacterConfig();
      loadExistingCharacters();
    }
  }, [isOpen]);

  // Update customization defaults when config loads
  useEffect(() => {
    if (personalityTraits.length > 0 && characterIdentities.length > 0 && guidingStyles.length > 0) {
      setCustomization(prev => ({
        ...prev,
        personality: prev.personality.trait ? prev.personality : personalityTraits[0],
        guidingStyle: prev.guidingStyle.id ? prev.guidingStyle : guidingStyles[0],
        identity: prev.identity.id ? prev.identity : characterIdentities[0]
      }));
    }
  }, [personalityTraits, characterIdentities, guidingStyles]);

  const loadCharacterConfig = async () => {
    try {
      setConfigLoading(true);
      const response = await fetch('/api/companions/character-config');
      const data = await response.json();

      if (data.success) {
        setPersonalityTraits(data.data.personalityTraits);
        setCharacterIdentities(data.data.characterIdentities);
        setGuidingStyles(data.data.guidingStyles);
      } else {
        console.error('Failed to load character configuration:', data.error);
      }
    } catch (error) {
      console.error('Failed to load character configuration:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadExistingCharacters = async () => {
    try {
      const response = await fetch('/api/companions/personalize-characters');
      const data = await response.json();
      setExistingCharacters(data.characters || []);
    } catch (error) {
      console.error('Failed to load existing characters:', error);
    }
  };

  const handleGenerateCharacter = async () => {
    if (!customization.name.trim()) {
      alert('Please enter a name for your character');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/companions/personalize-characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customization),
      });

      const data = await response.json();
      if (data.success) {
        onCharacterGenerated(data.character);
        onClose();
        // Reset form
        setCustomization({
          name: '',
          personality: personalityTraits[0],
          guidingStyle: guidingStyles[0],
          identity: characterIdentities[0],
          additionalTraits: ''
        });
      } else {
        alert('Failed to generate character. Please try again.');
      }
    } catch (error) {
      console.error('Error generating character:', error);
      alert('Failed to generate character. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectExistingCharacter = () => {
    const character = existingCharacters.find(c => c.id === selectedExistingCharacter);
    if (character) {
      onCharacterGenerated(character);
      onClose();
    }
  };

  const handleEditCharacter = (character: GeneratedCharacter) => {
    setEditingCharacter(character);
    setEditingCustomization({
      name: character.name,
      personality: character.personality,
      guidingStyle: character.guidingStyle,
      identity: character.identity,
      additionalTraits: character.additionalTraits || ''
    });
  };

  const handleSaveCharacterEdit = async () => {
    if (!editingCharacter || !editingCustomization.name.trim()) {
      alert('Please enter a name for your character');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/companions/personalize-characters/${editingCharacter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCustomization),
      });

      const data = await response.json();
      if (data.success) {
        // Update the character in existingCharacters list
        setExistingCharacters(prev =>
          prev.map(c => c.id === editingCharacter.id ? data.character : c)
        );
        setEditingCharacter(null);
        // If this was the selected character, update it
        if (selectedExistingCharacter === editingCharacter.id) {
          onCharacterGenerated(data.character);
        }
      } else {
        alert('Failed to update character. Please try again.');
      }
    } catch (error) {
      console.error('Error updating character:', error);
      alert('Failed to update character. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCharacter(null);
    setEditingCustomization({
      name: '',
      personality: personalityTraits[0] || {} as CharacterPersonality,
      guidingStyle: guidingStyles[0] || {} as CharacterGuidingStyle,
      identity: characterIdentities[0] || {} as CharacterIdentity,
      additionalTraits: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl h-4/5 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">✨ Character Customization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-colors"
          >
            ✕
          </button>
        </div>


        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {configLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading character options...</p>
              </div>
            </div>
          ) : editingCharacter ? (
            <div className="space-y-6">
              <CharacterPreview
                character={editingCharacter}
                customization={editingCustomization}
                onBack={handleCancelEdit}
              />

              {/* Edit Form */}
              <CharacterCustomizationForm
                customization={editingCustomization}
                personalityTraits={personalityTraits}
                characterIdentities={characterIdentities}
                guidingStyles={guidingStyles}
                onCustomizationChange={setEditingCustomization}
                onSubmit={handleSaveCharacterEdit}
                isGenerating={isGenerating}
                submitButtonText="Save Changes 💾"
                showCancelButton={true}
                onCancel={handleCancelEdit}
              />
            </div>
          ) : activeTab === 'create' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setActiveTab('select')}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-2 text-sm transition-colors"
                >
                  <span>←</span>
                  <span>Back to Character List</span>
                </button>
                <div className="h-4 w-px bg-slate-600"></div>
                <h3 className="text-lg font-semibold text-white">🎨 Create A New Character</h3>
              </div>
              <CharacterCustomizationForm
                customization={customization}
                personalityTraits={personalityTraits}
                characterIdentities={characterIdentities}
                guidingStyles={guidingStyles}
                onCustomizationChange={setCustomization}
                onSubmit={handleGenerateCharacter}
                isGenerating={isGenerating}
                submitButtonText="✨ Generate My Character"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-semibold text-white">📚 Select An Existing Character ({existingCharacters.length})</h3>
                <button
                  onClick={() => setActiveTab('create')}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm transition-colors"
                >
                  <span>🎨</span>
                  <span>Create New</span>
                </button>
              </div>
              <CharacterList
                characters={existingCharacters}
                selectedCharacterId={selectedExistingCharacter}
                onCharacterSelect={setSelectedExistingCharacter}
                onCharacterEdit={handleEditCharacter}
                onSelectCharacter={handleSelectExistingCharacter}
                onCreateNew={() => setActiveTab('create')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
