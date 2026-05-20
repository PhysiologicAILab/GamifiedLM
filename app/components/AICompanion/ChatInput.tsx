import { useState, useRef, useCallback, useEffect } from 'react';
import type { GeneratedCharacter } from '../types';

interface ChatInputProps {
  inputText: string;
  status: string;
  currentCharacter: GeneratedCharacter | null;
  availableCharacters: GeneratedCharacter[];
  onInputChange: (value: string) => void;
  onSendMessage: (message?: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  pendingVoiceMessage?: string | null;
}

export default function ChatInput({
  inputText,
  status,
  currentCharacter,
  availableCharacters,
  onInputChange,
  onSendMessage,
  onKeyPress,
  pendingVoiceMessage
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try to use a more compatible format
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options = { mimeType: 'audio/wav' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    // Create abort controller for this transcription request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const formData = new FormData();

      // Determine file extension based on MIME type
      let filename = 'recording.webm';
      if (audioBlob.type.includes('mp4')) {
        filename = 'recording.mp4';
      } else if (audioBlob.type.includes('wav')) {
        filename = 'recording.wav';
      } else if (audioBlob.type.includes('webm')) {
        filename = 'recording.webm';
      }

      formData.append('audio', audioBlob, filename);

      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const { text } = await response.json();

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Send the transcribed text directly without updating input field
      if (text.trim()) {
        onSendMessage(text);
      }

    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Transcription cancelled');
        return;
      }

      console.error('Transcription error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to transcribe audio: ${message}`);
    } finally {
      setIsTranscribing(false);
      abortControllerRef.current = null;
    }
  };

  const handleMicPress = useCallback(async () => {
    if (isTranscribing) {
      // Cancel ongoing transcription
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsTranscribing(false);
      return;
    }

    if (!isRecording) {
      await startRecording();
    }
  }, [isRecording, isTranscribing]);

  const handleMicRelease = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in the input field
      const isInputFocused = inputRef.current === document.activeElement;
      
      // Space key for press-to-talk (only when not typing in input)
      if (e.code === 'Space' && !isInputFocused && !e.repeat) {
        e.preventDefault();
        if (status === 'ready' && currentCharacter && !isTranscribing) {
          handleMicPress();
        }
      }
      
      // Enter key for sending message (works globally)
      if (e.key === 'Enter' && !e.shiftKey) {
        // If input is focused, let the existing onKeyPress handle it
        if (isInputFocused) {
          return;
        }
        // If input is not focused, trigger send if there's text
        e.preventDefault();
        if (inputText.trim() && status === 'ready' && currentCharacter && !isRecording && !isTranscribing) {
          onSendMessage();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release space key to stop recording (only when not typing in input)
      const isInputFocused = inputRef.current === document.activeElement;
      if (e.code === 'Space' && !isInputFocused) {
        e.preventDefault();
        if (isRecording) {
          handleMicRelease();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [status, currentCharacter, isRecording, isTranscribing, inputText, handleMicPress, handleMicRelease, onSendMessage]);

  return (
    <div className="relative border-t border-slate-600/50 bg-gradient-to-r from-slate-800/50 via-slate-800/80 to-slate-800/50 backdrop-blur-sm">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 animate-pulse" />

      <div className="relative z-10 p-4">
        {availableCharacters.length === 0 ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 text-sm rounded-full backdrop-blur-sm border border-slate-600/30">
              <span className="text-lg">🎭</span>
              Create a character to start your learning journey
            </div>
          </div>
        ) : (
          <>
            <div className="flex space-x-3">
              {/* Enhanced input field */}
              <div className="flex-1 relative group">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyPress={onKeyPress}
                  placeholder={
                    isTranscribing 
                      ? "🎤 Transcribing your voice..." 
                      : pendingVoiceMessage 
                        ? "⏳ Voice message queued..." 
                        : "Ask anything..."
                  }
                  disabled={status !== 'ready' || !currentCharacter || isRecording || isTranscribing}
                  className="w-full px-4 py-3 bg-gradient-to-r from-slate-700/80 to-slate-600/80 text-slate-100 placeholder-slate-400 rounded-2xl text-sm backdrop-blur-sm border border-slate-500/50 focus:outline-none focus:border-purple-400/70 focus:ring-2 focus:ring-purple-400/20 disabled:opacity-50 transition-all duration-300 group-hover:border-slate-400/60 h-12"
                />
                {/* Input glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              {/* Enhanced voice recording button */}
              <button
                onMouseDown={handleMicPress}
                onMouseUp={handleMicRelease}
                onMouseLeave={handleMicRelease}
                onTouchStart={handleMicPress}
                onTouchEnd={handleMicRelease}
                disabled={status !== 'ready' || !currentCharacter}
                className={`group relative px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-300 transform select-none border shadow-lg h-12 w-12 flex items-center justify-center ${isTranscribing
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white cursor-pointer border-yellow-400/50 shadow-yellow-500/25 animate-pulse'
                    : isRecording
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse border-red-400/50 shadow-red-500/25 scale-105'
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-slate-200 border-slate-500/50 hover:border-slate-400/60 hover:shadow-slate-500/25 hover:scale-105'
                  } disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none`}
                title={
                  isTranscribing
                    ? 'Click to cancel transcription'
                    : isRecording
                      ? 'Release to stop recording'
                      : 'Hold to record voice input'
                }
              >
                <div className="flex items-center justify-center">
                  <span className="text-base">
                    {isTranscribing ? '⏳' : isRecording ? '🔴' : '🎤'}
                  </span>
                  {isRecording && (
                    <div className="absolute -bottom-1 flex space-x-0.5">
                      <div className="w-0.5 h-0.5 bg-white rounded-full animate-bounce" />
                      <div className="w-0.5 h-0.5 bg-white rounded-full animate-bounce animation-delay-300" />
                      <div className="w-0.5 h-0.5 bg-white rounded-full animate-bounce animation-delay-500" />
                    </div>
                  )}
                </div>

                {/* Button glow effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isTranscribing
                    ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20'
                    : isRecording
                      ? 'bg-gradient-to-r from-red-400/20 to-pink-400/20'
                      : 'bg-gradient-to-r from-white/10 to-transparent'
                  }`} />
              </button>

              {/* Enhanced send button */}
              <button
                onClick={() => onSendMessage()}
                disabled={!inputText.trim() || status !== 'ready' || !currentCharacter || isRecording || isTranscribing}
                className="group relative px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:shadow-none border border-purple-500/50 hover:border-purple-400/60 disabled:border-slate-600/50 overflow-hidden h-12 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 flex items-center justify-center">
                  <span className="text-base">🚀</span>
                </div>
              </button>
            </div>

          </>
        )}
      </div>
    </div>
  );
}

