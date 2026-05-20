'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import CharacterSettings from './CharacterSettings';
import AvatarButton from './AICompanion/AvatarButton';
import ChatHeader from './AICompanion/ChatHeader';
import MessagesView from './AICompanion/MessagesView';
import ChatInput from './AICompanion/ChatInput';
import { useCharacterManagement } from './hooks/useCharacterManagement';
import { useDragAndPosition } from './hooks/useDragAndPosition';
import type { GeneratedCharacter, LearningContextSnapshot, GameState } from './types';

interface AICompanionProps {
  className?: string;
  context?: LearningContextSnapshot;
  currentSectionTitle?: string;
  roadmapTitle?: string;
  onClearSelectedBlock?: () => void;
}

const GAME_STATE_LABELS: Record<GameState, string> = {
  roadmap: 'Choosing a subtask',
  intro: 'Starting a subtask',
  reading: 'Reading',
  challenge: 'Challenge in progress',
  'partial-score': 'Reviewing results',
  reward: 'Earning rewards',
  completed: 'All done!',
};

export default function AICompanion({ className = '', context, currentSectionTitle, roadmapTitle, onClearSelectedBlock }: AICompanionProps) {
  // UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [pendingVoiceMessage, setPendingVoiceMessage] = useState<string | null>(null);

  // Custom hooks
  const {
    currentCharacter,
    availableCharacters,
    isLoading,
    loadCharacters,
    selectCharacter,
    handleCharacterGenerated,
  } = useCharacterManagement();

  const {
    position,
    isDragging,
    chatWindowRef,
    handleMouseDown,
    restorePosition,
  } = useDragAndPosition();

  // Refs hold the latest context so the chat transport (which is created once
  // per character) always sends fresh state — `useChat` captures the transport
  // on mount and would otherwise serialise stale data from the first render.
  const characterIdRef = useRef<string | undefined>(currentCharacter?.id);
  const contextRef = useRef<LearningContextSnapshot | undefined>(context);
  useEffect(() => { characterIdRef.current = currentCharacter?.id; }, [currentCharacter?.id]);
  useEffect(() => { contextRef.current = context; }, [context]);

  // Stable transport keyed on character id. `prepareSendMessagesRequest` reads
  // from refs at send time, so every message carries the live snapshot of
  // material / section / game state / score / focused paragraph.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/companions/chat',
        prepareSendMessagesRequest: ({ messages, id, body }) => ({
          body: {
            ...body,
            id,
            messages,
            characterId: characterIdRef.current,
            context: contextRef.current,
          },
        }),
      }),
    [currentCharacter?.id],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    id: currentCharacter?.id || 'default',
  });

  // Event handlers
  const handleSendMessage = (message?: string) => {
    const textToSend = message || inputText;
    if (!textToSend.trim()) return;
    
    // If this is a voice message and chat is busy, queue it for later
    if (message && status !== 'ready') {
      setPendingVoiceMessage(textToSend);
      return;
    }
    
    // If chat is not ready and this is not a voice message, ignore
    if (status !== 'ready') return;
    
    sendMessage({ text: textToSend });
    if (!message) {
      // Only clear input if sending from input field (not from voice)
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      restorePosition();
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openSettings();
  };


  const handleCharacterGeneratedWrapper = (character: GeneratedCharacter) => {
    handleCharacterGenerated(character);
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    if (isExpanded || isSettingsOpen) {
      loadCharacters();
    }
  };

  // Effect to add welcome message when character is loaded and no messages exist
  useEffect(() => {
    if (currentCharacter && messages.length === 0 && status === 'ready') {
      const welcomeMessage = {
        id: `welcome-${currentCharacter.id}`,
        role: 'assistant' as const,
        parts: [{
          type: 'text' as const,
          text: currentCharacter.greeting || "Hi there! I'm your AI learning companion. How can I help you today? 🚀"
        }]
      };
      setMessages([welcomeMessage]);
    }
  }, [currentCharacter, messages.length, status, setMessages]);

  // Effect to handle pending voice messages when status becomes ready
  useEffect(() => {
    if (pendingVoiceMessage && status === 'ready') {
      sendMessage({ text: pendingVoiceMessage });
      setPendingVoiceMessage(null);
    }
  }, [pendingVoiceMessage, status, sendMessage]);

  return (
    <>
      <AvatarButton
        isExpanded={isExpanded}
        currentCharacter={currentCharacter}
        availableCharacters={availableCharacters}
        isLoading={isLoading}
        onToggleExpanded={toggleExpanded}
      />

      {isExpanded && (
        <div
          ref={chatWindowRef}
          className="fixed bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-purple-900/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl shadow-purple-900/25 z-50 flex flex-col overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            width: '600px',
            height: '750px',
            pointerEvents: 'auto' // Ensure chat window is always interactive
          }}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 animate-pulse pointer-events-none" />
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] animate-pulse" />
          </div>
          
          {/* Gamified border glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/10 to-indigo-400/20 rounded-2xl animate-pulse opacity-50 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full">
            <ChatHeader
              currentCharacter={currentCharacter}
              availableCharacters={availableCharacters}
              onMouseDown={handleMouseDown}
              onAvatarClick={handleAvatarClick}
              onClose={toggleExpanded}
            />

            <ContextStrip
              context={context}
              currentSectionTitle={currentSectionTitle}
              roadmapTitle={roadmapTitle}
              onClearSelectedBlock={onClearSelectedBlock}
            />

            <div className="flex-1 overflow-hidden">
              <MessagesView
                messages={messages}
                currentCharacter={currentCharacter}
                availableCharacters={availableCharacters}
                onCreateCharacter={openSettings}
              />
            </div>

            <ChatInput
              inputText={inputText}
              status={status}
              currentCharacter={currentCharacter}
              availableCharacters={availableCharacters}
              onInputChange={setInputText}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              pendingVoiceMessage={pendingVoiceMessage}
            />
          </div>
        </div>
      )}

      <CharacterSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onCharacterGenerated={handleCharacterGeneratedWrapper}
        currentCharacter={currentCharacter || undefined}
      />
    </>
  );
}

interface ContextStripProps {
  context?: LearningContextSnapshot;
  currentSectionTitle?: string;
  roadmapTitle?: string;
  onClearSelectedBlock?: () => void;
}

function ContextStrip({ context, currentSectionTitle, roadmapTitle, onClearSelectedBlock }: ContextStripProps) {
  if (!context?.materialName) return null;

  const {
    gameState,
    playerScore,
    completedSectionIds,
    totalSections,
    selectedBlockId,
  } = context;

  const completed = completedSectionIds?.length ?? 0;
  const total = totalSections ?? 0;
  const stateLabel = gameState ? GAME_STATE_LABELS[gameState] : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-slate-600/40 bg-slate-900/40 text-[11px] text-slate-200">
      {(roadmapTitle || context.materialName) && (
        <span
          className="px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/50 truncate max-w-[200px]"
          title={roadmapTitle || context.materialName}
        >
          📘 {roadmapTitle || context.materialName}
        </span>
      )}
      {currentSectionTitle && (
        <span
          className="px-2 py-0.5 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-100 truncate max-w-[200px]"
          title={currentSectionTitle}
        >
          🎯 {currentSectionTitle}
        </span>
      )}
      {stateLabel && (
        <span className="px-2 py-0.5 rounded-full bg-purple-600/30 border border-purple-400/40 text-purple-100">
          {stateLabel}
        </span>
      )}
      {total > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-emerald-600/30 border border-emerald-400/40 text-emerald-100">
          {completed}/{total} done
        </span>
      )}
      {typeof playerScore === 'number' && playerScore > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/40 text-amber-100">
          ⭐ {playerScore}
        </span>
      )}
      {selectedBlockId && (
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-100 truncate max-w-[260px]"
          title={`Focused paragraph: ${selectedBlockId}`}
        >
          📌 Focused paragraph
          {onClearSelectedBlock && (
            <button
              onClick={onClearSelectedBlock}
              className="ml-1 text-amber-200 hover:text-white transition-colors"
              title="Clear focused paragraph"
            >
              ✕
            </button>
          )}
        </span>
      )}
    </div>
  );
}
