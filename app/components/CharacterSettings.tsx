'use client';

import CharacterSettingsModal from './AICompanion/CharacterSettingsModal';
import type { CharacterSettingsProps } from './types';

export default function CharacterSettings(props: CharacterSettingsProps) {
  return <CharacterSettingsModal {...props} />;
}
