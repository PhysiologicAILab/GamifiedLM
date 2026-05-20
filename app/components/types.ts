export interface LearningSection {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  blockIds: string[];
}

// New subtask interface (same structure as LearningSection for compatibility)
export interface LearningSubtask {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  blockIds: string[];
}

export interface LearningRoadmap {
  title: string;
  description: string;
  totalSubtasks: number;
  subtasks: LearningSubtask[];
  estimatedTotalTime: number;
  // Backward compatibility
  totalSections?: number;
  sections?: LearningSection[];
}

export interface GameTimerProps {
  duration: number;
  isActive: boolean;
  onTimeUp: () => void;
  onReset?: () => void;
}

export interface LearningRoadmapViewProps {
  sections: LearningSection[];
  onSectionSelect: (section: LearningSection) => void;
  completedSections: string[];
  currentSectionId?: string;
}


export interface GameStateProps {
  currentSection: LearningSection | null;
  playerScore: number;
  onAction?: () => void;
  onContinue?: () => void;
}

export type GameState = 'roadmap' | 'intro' | 'reading' | 'challenge' | 'partial-score' | 'reward' | 'completed';

// Snapshot of the learner's current context, shared with the AI companion
// so it can tailor its responses to where the user is in their journey.
export interface LearningContextSnapshot {
  materialName?: string;
  currentSectionId?: string | null;
  gameState?: GameState;
  playerScore?: number;
  completedSectionIds?: string[];
  totalSections?: number;
  selectedBlockId?: string | null;
}

export interface ExerciseQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  relatedBlockIds: string[];
}

export interface ExerciseSet {
  id: string;
  sectionId: string;
  questions: ExerciseQuestion[];
}

export interface ChallengeStateProps {
  currentSection: LearningSection;
  materialName?: string;
  onChallengeComplete: (score?: number, exerciseResults?: ExerciseResults) => void;
  onPartialScore?: (score: number, exerciseResults: ExerciseResults) => void;
  retryKey?: number; // Key to force reset when retrying
}

export interface ExerciseResults {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  completedAt: Date;
  questionResults: Array<{
    questionId: string;
    userAnswerIndex: number;
    correctAnswerIndex: number;
    isCorrect: boolean;
    timeSpent: number;
  }>;
}

// Character customization types
export interface CharacterPersonality {
  trait: string;
  description: string;
}

export interface CharacterIdentity {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export interface CharacterGuidingStyle {
  id: string;
  name: string;
  description: string;
  approach: string;
}

export interface CharacterCustomization {
  name: string;
  personality: CharacterPersonality;
  guidingStyle: CharacterGuidingStyle;
  identity: CharacterIdentity;
  additionalTraits: string;
}

export interface GeneratedCharacter {
  id: string;
  name: string;
  personality: CharacterPersonality;
  guidingStyle: CharacterGuidingStyle;
  identity: CharacterIdentity;
  additionalTraits: string;
  systemPrompt: string;
  greeting: string;
  avatar: string;
  avatarPath?: string; // Path to generated avatar image
  createdAt: string;
  lastUsed?: string;
}

export interface CharacterSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterGenerated: (character: GeneratedCharacter) => void;
  currentCharacter?: GeneratedCharacter;
}