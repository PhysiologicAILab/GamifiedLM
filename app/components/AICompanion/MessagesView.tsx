import { useRef, useEffect, useState } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import type { GeneratedCharacter } from '../types';
import MessageMarkdown from './MessageMarkdown';

interface MessagesViewProps {
  messages: UIMessage[];
  currentCharacter: GeneratedCharacter | null;
  availableCharacters: GeneratedCharacter[];
  onCreateCharacter: () => void;
}

export default function MessagesView({
  messages,
  currentCharacter,
  availableCharacters,
  onCreateCharacter
}: MessagesViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // Check if user has scrolled up from bottom
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px threshold
    setIsUserScrolledUp(!isAtBottom);
  };

  // Auto-scroll to bottom when new messages are added, but only if user hasn't scrolled up
  useEffect(() => {
    if (!isUserScrolledUp && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isUserScrolledUp]);

  // Scroll to bottom when component first loads
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  // Function to scroll to bottom manually
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsUserScrolledUp(false);
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto custom-scrollbar relative"
      onScroll={handleScroll}
      style={{ maxHeight: '100%' }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-transparent to-purple-900/20 pointer-events-none" />
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] animate-pulse" />
      </div>
      
      {/* Content container with improved padding and spacing */}
      <div className="p-6 space-y-6">

      {/* No character hint - only show when no characters exist */}
      {messages.length === 0 && availableCharacters.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 relative z-10">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 animate-pulse rounded-3xl" />
          
          <div className="relative">
            <div className="text-7xl mb-4 animate-bounce">🎭</div>
            <div className="absolute -top-2 -right-2 text-2xl animate-spin-slow">✨</div>
            <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce animation-delay-500">🌟</div>
          </div>
          
          <div className="space-y-3 relative">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              Create Your AI Learning Companion
            </h3>
            <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
              Embark on your learning journey with a personalized AI character that adapts to your unique style and preferences.
            </p>
          </div>
          
          <button
            onClick={onCreateCharacter}
            className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25 flex items-center gap-3 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="text-lg">✨</span>
            <span className="relative z-10">Create Your Character</span>
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
          </button>
          
          <div className="text-xs text-slate-400 mt-2 px-4 py-2 bg-slate-700/30 rounded-full backdrop-blur-sm border border-slate-600/30">
            🎨 Choose personality • 📚 Teaching style • 🎯 Learning goals
          </div>
        </div>
      )}
      
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`flex items-start animate-fade-in ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {message.role === 'user' ? (
            // User message layout (right-aligned)
            <>
              {/* Message bubble */}
              <div className="relative group mr-3">
                <div className="max-w-[500px] p-4 relative overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl rounded-tr-md border border-purple-500/50">
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    {message.parts.map((part, partIndex) =>
                      part.type === 'text' ? (
                        <MessageMarkdown 
                          key={partIndex} 
                          content={part.text}
                        />
                      ) : null
                    )}
                  </div>
                </div>
                
                {/* Message tail */}
                <div className="absolute top-3 -right-1.5 w-3 h-3 bg-gradient-to-br from-purple-600 to-purple-700 rotate-45 border-r border-b border-purple-500/50" />
              </div>
              
              {/* Avatar for user messages */}
              <div className="flex-shrink-0 relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm text-white font-bold shadow-md border-2 border-purple-400/50">
                  👤
                </div>
              </div>
            </>
          ) : (
            // AI message layout (left-aligned)
            <>
              {/* Avatar for AI messages */}
              <div className="flex-shrink-0 relative mr-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-400/50 shadow-md">
                  {currentCharacter?.avatarPath ? (
                    <img
                      src={`/api/companions/${currentCharacter.id}/avatar`}
                      alt={currentCharacter.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallbackDiv = target.nextElementSibling as HTMLElement;
                        if (fallbackDiv) {
                          fallbackDiv.classList.remove('hidden');
                          fallbackDiv.classList.add('flex');
                        }
                      }}
                    />
                  ) : null}
                  <div className={`${currentCharacter?.avatarPath ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-sm bg-gradient-to-br from-purple-500 to-indigo-500`}>
                    {currentCharacter?.avatar || '🤖'}
                  </div>
                </div>
              </div>
              
              {/* Message bubble */}
              <div className="relative group">
                <div className="max-w-[500px] p-4 relative overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-xl bg-gradient-to-br from-slate-700/90 to-slate-800/90 text-slate-100 rounded-2xl rounded-tl-md backdrop-blur-sm border border-slate-600/50">
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    {message.parts.map((part, partIndex) =>
                      part.type === 'text' ? (
                        <MessageMarkdown 
                          key={partIndex} 
                          content={part.text}
                        />
                      ) : null
                    )}
                  </div>
                </div>
                
                {/* Message tail */}
                <div className="absolute top-3 -left-1.5 w-3 h-3 bg-gradient-to-br from-slate-700/90 to-slate-800/90 rotate-45 border-l border-t border-slate-600/50" />
              </div>
            </>
          )}
        </div>
      ))}
      
      {/* Enhanced loading indicator */}
      {messages.length > 0 && messages[messages.length - 1].role === 'user' && (
        <div className="flex justify-start items-start animate-fade-in">
          {/* Character avatar */}
          <div className="flex-shrink-0 relative mr-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-400/50 shadow-md">
              {currentCharacter?.avatarPath ? (
                <img
                  src={`/api/companions/${currentCharacter.id}/avatar`}
                  alt={currentCharacter.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallbackDiv = target.nextElementSibling as HTMLElement;
                    if (fallbackDiv) {
                      fallbackDiv.classList.remove('hidden');
                      fallbackDiv.classList.add('flex');
                    }
                  }}
                />
              ) : null}
              <div className={`${currentCharacter?.avatarPath ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-sm bg-gradient-to-br from-purple-500 to-indigo-500`}>
                {currentCharacter?.avatar || '🤖'}
              </div>
            </div>
          </div>
          
          {/* Typing indicator */}
          <div className="relative">
            <div className="max-w-[500px] p-5 rounded-2xl rounded-tl-md bg-gradient-to-br from-slate-700/90 to-slate-800/90 text-slate-100 backdrop-blur-sm border border-slate-600/50 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-300" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-500" />
                </div>
              </div>
            </div>
            {/* Message tail */}
            <div className="absolute top-3 -left-1.5 w-3 h-3 bg-gradient-to-br from-slate-700/90 to-slate-800/90 rotate-45 border-l border-t border-slate-600/50" />
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

