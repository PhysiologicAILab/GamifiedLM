import { useState, useEffect } from 'react';
import type { GeneratedCharacter } from '../types';

export function useCharacterManagement() {
  const [currentCharacter, setCurrentCharacter] = useState<GeneratedCharacter | null>(null);
  const [availableCharacters, setAvailableCharacters] = useState<GeneratedCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCharacters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/companions/personalize-characters');
      const data = await response.json();
      if (data.characters && data.characters.length > 0) {
        setAvailableCharacters(data.characters);
        // Use the most recently used character if none is selected
        if (!currentCharacter) {
          setCurrentCharacter(data.characters[0]);
        }
      } else {
        // No characters available
        setAvailableCharacters([]);
        setCurrentCharacter(null);
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
      setAvailableCharacters([]);
      setCurrentCharacter(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCharacterLastUsed = async (characterId: string) => {
    try {
      await fetch(`/api/companions/personalize-characters/${characterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lastUsed: new Date().toISOString() }),
      });
    } catch (error) {
      console.error('Failed to update character last used:', error);
    }
  };

  const selectCharacter = (character: GeneratedCharacter) => {
    setCurrentCharacter(character);
    updateCharacterLastUsed(character.id);
    // Reload to update order
    setTimeout(() => loadCharacters(), 100);
  };

  const handleCharacterGenerated = (character: GeneratedCharacter) => {
    setCurrentCharacter(character);
    // Update last used timestamp
    updateCharacterLastUsed(character.id);
    // Reload characters to update the list
    loadCharacters();
  };

  // Load characters on mount
  useEffect(() => {
    loadCharacters();
  }, []);

  return {
    currentCharacter,
    availableCharacters,
    isLoading,
    loadCharacters,
    selectCharacter,
    handleCharacterGenerated,
  };
}

