'use client';

import { useState, useEffect } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { ChallengeStateProps, ExerciseSet, ExerciseQuestion, ExerciseResults } from '../types';
import { exerciseSetSchema } from '../../api/learning-materials/subtasks/exercises/schema';

export default function ChallengeState({ currentSection, materialName = 'sample-1', onChallengeComplete, onPartialScore, retryKey = 0 }: ChallengeStateProps) {
  const [exerciseSet, setExerciseSet] = useState<ExerciseSet | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [backgroundImagePath, setBackgroundImagePath] = useState<string | null>(null);
  const [isLoadingBackgroundImage, setIsLoadingBackgroundImage] = useState(false);

  // Use the streaming object hook - following AI SDK best practices
  const { 
    object: streamingExerciseSet, 
    submit, 
    isLoading, 
    error,
    stop
  } = useObject({
    api: '/api/learning-materials/subtasks/exercises',
    schema: exerciseSetSchema,
    onFinish: ({ object, error }) => {
      if (object && !error) {
        console.log('Exercise generation completed:', object);
        setExerciseSet(object);  // Update the state immediately
        saveExerciseSet(object);
        // Background image generation is already running in parallel
      }
    },
    onError: (error) => {
      console.error('Streaming error:', error);
    }
  });

  useEffect(() => {
    checkForExistingExercises();
  }, [currentSection.id, materialName]);

  // Background image loading is handled in checkForExistingExercises

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Reset quiz state when retryKey changes (indicating a retry)
  useEffect(() => {
    if (retryKey > 0) {
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowExplanation(false);
      setIsAnswered(false);
      setScore(0);
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
      setQuestionTimes({});
      setIsCompleted(false);
    }
  }, [retryKey]);

  const checkForExistingExercises = async () => {
    try {
      setCheckingExisting(true);

      // Start background image generation immediately and in parallel
      generateBackgroundImageParallel();

      // Try to get existing exercises
      const getResponse = await fetch(`/api/learning-materials/subtasks/exercises?materialName=${materialName}&sectionId=${currentSection.id}`);

      if (getResponse.ok) {
        const { exerciseSet: existingSet } = await getResponse.json();
        setExerciseSet(existingSet);
      } else {
        // No existing exercises, generate new ones
        generateNewExercises();
      }
    } catch (err) {
      console.error('Error checking for existing exercises:', err);
      // If we can't check for existing ones, try to generate new ones
      generateNewExercises();
    } finally {
      setCheckingExisting(false);
    }
  };

  const generateNewExercises = () => {
    const requestData = {
      materialName,
      sectionId: currentSection.id,
      currentSection,
    };
    submit(requestData);
  };

  const saveExerciseSet = async (exerciseSet: any) => {
    try {
      const response = await fetch('/api/learning-materials/subtasks/exercises/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialName,
          sectionId: currentSection.id,
          exerciseSet,
        }),
      });

      if (response.ok) {
        console.log('Exercise set saved successfully from client');
      } else {
        console.error('Failed to save exercise set from client:', await response.text());
      }
    } catch (error) {
      console.error('Error saving exercise set from client:', error);
    }
  };

  // Function to generate background image in parallel (independent of exercise content)
  const generateBackgroundImageParallel = async () => {
    // Check if image already exists first
    try {
      const existingImageResponse = await fetch(
        `/api/learning-materials/subtasks/exercises/image?materialName=${materialName}&sectionId=${currentSection.id}`
      );
      
      if (existingImageResponse.ok) {
        setBackgroundImagePath(`/api/learning-materials/subtasks/exercises/image?materialName=${materialName}&sectionId=${currentSection.id}`);
        return; // Image already exists, no need to generate
      }
    } catch (error) {
      // Image doesn't exist, continue with generation
    }
    
    setIsLoadingBackgroundImage(true);
    try {
      const imageResponse = await fetch('/api/learning-materials/subtasks/exercises/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialName,
          sectionId: currentSection.id
        })
      });

      if (imageResponse.ok) {
        const imageResult = await imageResponse.json();
        setBackgroundImagePath(imageResult.imagePath);
      }
    } catch (error) {
      console.warn('Failed to generate background image:', error);
    } finally {
      setIsLoadingBackgroundImage(false);
    }
  };


  // Always use the most current data - streaming or final
  const currentExerciseSet = streamingExerciseSet || exerciseSet;
  const allQuestions = currentExerciseSet?.questions || [];
  
  // During streaming, always show the first question to avoid flicker
  // After streaming completes, use the normal currentQuestionIndex
  const displayQuestionIndex = isLoading ? 0 : currentQuestionIndex;
  const currentQuestion = allQuestions[displayQuestionIndex];
  
  // Stabilize the first question during streaming to prevent flicker
  const [stableFirstQuestion, setStableFirstQuestion] = useState<any>(null);
  
  useEffect(() => {
    if (isLoading && allQuestions[0] && isQuestionInteractive(allQuestions[0]) && !stableFirstQuestion) {
      // Once the first question is complete, lock it in to prevent flicker
      setStableFirstQuestion(allQuestions[0]);
    } else if (!isLoading) {
      // Clear the stable question when not loading
      setStableFirstQuestion(null);
    }
  }, [isLoading, allQuestions, stableFirstQuestion]);
  
  // Use stable question during streaming, current question otherwise
  const displayQuestion = isLoading && stableFirstQuestion ? stableFirstQuestion : currentQuestion;
  
  // Helper function to check if a question is complete enough for interaction
  const isQuestionInteractive = (question: any): boolean => {
    return question && 
           typeof question.id === 'string' && 
           typeof question.question === 'string' && 
           Array.isArray(question.options) && 
           question.options.length > 0 &&
           typeof question.correctAnswerIndex === 'number';
  };

  // Count complete questions for progress calculation
  const completeQuestions = allQuestions.filter(isQuestionInteractive);
  const isLastQuestion = currentQuestionIndex === (completeQuestions.length - 1);

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered || !displayQuestion?.id || !isQuestionInteractive(displayQuestion)) return;

    const timeSpent = Date.now() - questionStartTime;
    setQuestionTimes(prev => ({
      ...prev,
      [displayQuestion.id as string]: timeSpent
    }));

    setUserAnswers(prev => ({
      ...prev,
      [displayQuestion.id as string]: answerIndex
    }));

    const isCorrect = answerIndex === displayQuestion.correctAnswerIndex;
    if (isCorrect) {
      setScore(prev => prev + 10); // Default points per question
    }

    setIsAnswered(true);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      completeExercise();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
      setShowExplanation(false);
    }
  };

  const completeExercise = () => {
    if (completeQuestions.length === 0) return;

    const totalTime = Date.now() - startTime;
    const correctAnswers = completeQuestions.filter(
      (q: any) => userAnswers[q.id] === q.correctAnswerIndex
    ).length;

    const finalScore = score + (correctAnswers === completeQuestions.length ? 20 : 0); // Default bonus points
    const isPercentCorrect = correctAnswers === completeQuestions.length;

    const results: ExerciseResults = {
      totalQuestions: completeQuestions.length,
      correctAnswers,
      score: finalScore,
      timeSpent: totalTime,
      completedAt: new Date(),
      questionResults: completeQuestions.map((q: any) => ({
        questionId: q.id,
        userAnswerIndex: userAnswers[q.id] ?? -1,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect: userAnswers[q.id] === q.correctAnswerIndex,
        timeSpent: questionTimes[q.id] || 0
      }))
    };

    setIsCompleted(true);

    // Delay to show completion animation
    setTimeout(() => {
      if (isPercentCorrect) {
        // 100% correct - show the celebration popup
        onChallengeComplete(finalScore, results);
      } else {
        // Partial score - show the encouragement popup
        if (onPartialScore) {
          onPartialScore(finalScore, results);
        } else {
          // Fallback to normal completion if onPartialScore not provided
          onChallengeComplete(finalScore, results);
        }
      }
    }, 2000);
  };

  // Show initial loading only when checking existing exercises
  if (checkingExisting) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-600/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 animate-pulse" />
            <div className="relative z-10 text-center">
              <div className="text-6xl mb-6 animate-spin">🔄</div>
              <div className="text-slate-300 text-lg">
                Checking for existing assessments for "{currentSection.title}"...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show initial generation loading before any streaming data arrives
  if (isLoading && !currentExerciseSet) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-600/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 animate-pulse" />
            <div className="relative z-10 text-center">
              <div className="text-6xl mb-6 animate-spin">🔄</div>
              <div className="text-slate-300 text-lg mb-4">
                Creating your personalized learning assessment for "{currentSection.title}"...
              </div>
              <div className="text-slate-400 text-sm">
                This may take a few moments
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-600/50 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 animate-pulse" />

          <div className="relative z-10">
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-3xl font-bold text-red-400 mb-4">
              Assessment Error
            </h3>
            <p className="text-slate-300 text-lg mb-6">
              {error.message || 'Failed to generate exercises'}
            </p>
            
            {/* Show retry and fallback options */}
            <div className="space-y-3">
              <button
                onClick={generateNewExercises}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/25"
              >
                🔄 Try Again
              </button>
              
              {completeQuestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-yellow-300 text-sm mb-2">
                    We have {completeQuestions.length} question{completeQuestions.length !== 1 ? 's' : ''} ready. Would you like to continue with these?
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 rounded-lg transition-all duration-200"
                  >
                    📝 Continue with Available Questions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    const correctAnswers = completeQuestions.filter(
      (q: any) => userAnswers[q.id] === q.correctAnswerIndex
    ).length;
    const percentage = Math.round((correctAnswers / completeQuestions.length) * 100);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-600/50 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-pulse" />

          <div className="relative z-10">
            <div className="text-6xl mb-6 animate-bounce">🎉</div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-6">
              Assessment Complete!
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-800/50 rounded-2xl p-6">
                <div className="text-4xl font-bold text-white mb-2">{percentage}%</div>
                <div className="text-slate-300 text-lg mb-4">
                  {correctAnswers} out of {completeQuestions.length} correct
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-2xl p-6 border border-purple-400/30">
                <div className="text-2xl font-bold text-purple-300 mb-2">
                  +{score} points earned!
                </div>
                <div className="text-purple-200">
                  Great work! You've completed this assessment.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show error state if we're not loading and have no data
  if (!currentExerciseSet && !isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-600/50 text-center">
        <div className="text-5xl mb-4">❓</div>
        <p className="text-slate-300">No exercises available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Question Card with Background Image and Progress Section */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-600/50 relative overflow-hidden">
        <div className="space-y-6">
          {/* Fantasy Adventure Background Image - Following NarrativePanel pattern */}
          {(backgroundImagePath || isLoadingBackgroundImage) && (
            <div className="relative -mx-6 -mt-6 mb-8">
              <div className="relative w-full h-80 overflow-hidden">
                {backgroundImagePath ? (
                  <>
                    <img
                      src={backgroundImagePath}
                      alt={`Fantasy adventure background for ${currentSection.title}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image if it fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {/* Gradient fade overlay - matching NarrativePanel */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-800 to-transparent pointer-events-none"></div>
                  </>
                ) : (
                  /* Background placeholder during generation - streaming effect like NarrativePanel */
                  <div className="w-full h-full bg-slate-700/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-400 text-sm">Generating magical academy...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Section - Now positioned below the image */}
          <div className="px-8 pb-6">
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-400/20">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 animate-pulse" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{isLoading ? '🔄' : '🎯'}</div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {isLoading ? 'Creating Your Assessment' : 'Checking Your Progress'}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {isLoading ? (
                          allQuestions.length > 0 
                            ? `Question 1 ready, ${Math.max(5 - allQuestions.length, 0)} more generating...`
                            : 'Generating questions...'
                        ) : (
                          `Question ${currentQuestionIndex + 1} of ${completeQuestions.length}`
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">Score: {score}</div>
                    <div className="text-sm text-slate-400">
                      {isLoading ? 'Preparing assessment...' : '10 pts per question'}
                    </div>
                  </div>
                </div>

                {/* Progress Bar with Question Nodes */}
                <div className="w-full">
                  {isLoading ? (
                    // Generation progress with question nodes
                    <div className="flex items-center justify-between mb-2">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const questionExists = index < allQuestions.length;
                        const questionComplete = questionExists && 
                          allQuestions[index]?.question && 
                          (allQuestions[index]?.options?.length || 0) > 0 && 
                          allQuestions[index]?.correctAnswerIndex !== undefined;
                        
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div 
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                                questionComplete 
                                  ? 'bg-green-500/20 border-green-400 text-green-300' 
                                  : questionExists 
                                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 animate-pulse'
                                    : 'bg-slate-700 border-slate-600 text-slate-500'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {questionComplete ? '✓' : questionExists ? '⏳' : '○'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Normal progress bar for answering questions
                    <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden mb-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${((currentQuestionIndex + (isAnswered ? 1 : 0)) / Math.max(completeQuestions.length, 1)) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="px-8 pb-8">
          <div className="mb-6">
            <div className="mb-3">
              <span className="pl-2 pr-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-full border border-slate-600/30 inline-block">
                📝 Question {displayQuestionIndex + 1}
              </span>
              {isLoading && !displayQuestion?.question && (
                <span className="ml-2 text-yellow-400 text-xs animate-pulse">⏳ Generating...</span>
              )}
              {displayQuestion?.question && isQuestionInteractive(displayQuestion) && (
                <span className="ml-2 text-green-400 text-xs">✓ Ready</span>
              )}
            </div>
            
            <div className="mb-6">
              {displayQuestion?.question ? (
                <h4 className="text-xl font-semibold text-slate-200 leading-relaxed">
                  {displayQuestion.question}
                </h4>
              ) : (
                <div className="space-y-2">
                  <div className="h-6 bg-slate-600/50 rounded animate-pulse"></div>
                  <div className="h-6 bg-slate-600/50 rounded animate-pulse w-3/4"></div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {(displayQuestion?.options || []).map((option: string, optionIndex: number) => {
              const hasOption = !!option;
              const userAnswer = displayQuestion?.id ? userAnswers[displayQuestion.id] : undefined;
              const isSelected = userAnswer === optionIndex;
              const isCorrect = optionIndex === displayQuestion?.correctAnswerIndex;
              const showCorrectness = isAnswered && showExplanation;
              const canInteract = !isAnswered && hasOption && isQuestionInteractive(displayQuestion);

              let buttonClass = "w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ";

              if (showCorrectness) {
                if (isCorrect) {
                  buttonClass += "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-200";
                } else if (isSelected && !isCorrect) {
                  buttonClass += "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/50 text-red-200";
                } else {
                  buttonClass += "bg-slate-800/50 border-slate-600/30 text-slate-400";
                }
              } else {
                if (isSelected) {
                  buttonClass += "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/50 text-purple-200";
                } else if (canInteract) {
                  buttonClass += "bg-slate-800/50 border-slate-600/30 text-slate-300 hover:border-purple-400/40 hover:bg-purple-500/10 cursor-pointer";
                } else {
                  buttonClass += "bg-slate-800/50 border-slate-600/30 text-slate-400";
                }
              }

              return (
                <button
                  key={optionIndex}
                  onClick={() => canInteract ? handleAnswerSelect(optionIndex) : undefined}
                  disabled={!canInteract}
                  className={buttonClass}
                  aria-label={hasOption ? `Option ${String.fromCharCode(65 + optionIndex)}: ${option}` : `Option ${String.fromCharCode(65 + optionIndex)}: Loading...`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full border-2 border-current mr-4 flex items-center justify-center text-sm font-bold backdrop-blur-sm">
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    {hasOption ? (
                      <span className="leading-relaxed">{option}</span>
                    ) : (
                      <div className="h-4 bg-slate-600/50 rounded animate-pulse flex-1"></div>
                    )}
                  </div>
                </button>
              );
            })}
            
            {/* Show loading placeholders only when streaming and no options are available yet */}
            {isLoading && (!displayQuestion?.options || displayQuestion.options.length === 0) && (
              <>
                {Array.from({ length: 4 }).map((_, optionIndex) => (
                  <button
                    key={`loading-${optionIndex}`}
                    disabled
                    className="w-full p-4 text-left rounded-xl border-2 transition-all duration-300 bg-slate-800/50 border-slate-600/30 text-slate-400"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full border-2 border-current mr-4 flex items-center justify-center text-sm font-bold backdrop-blur-sm">
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <div className="h-4 bg-slate-600/50 rounded animate-pulse flex-1"></div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Show answer feedback */}
          {showExplanation && displayQuestion && displayQuestion.id && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-400/30 backdrop-blur-sm">
              <h5 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <span>{userAnswers[displayQuestion.id] === displayQuestion.correctAnswerIndex ? '✅' : '❌'}</span>
                {userAnswers[displayQuestion.id] === displayQuestion.correctAnswerIndex ? 'Correct!' : 'Incorrect'}
              </h5>
              <p className="text-blue-200 leading-relaxed">
                The correct answer is: <strong>{displayQuestion.options?.[displayQuestion.correctAnswerIndex ?? 0]}</strong>
              </p>
            </div>
          )}

          {/* Streaming indicator - only show if we have the first question but still loading */}
          {isLoading && displayQuestion && (
            <div className="mt-4 text-center">
              <div className="text-xs text-slate-500 bg-slate-800/30 rounded-full px-3 py-1 inline-block">
                <span className="animate-pulse">⚡</span> More questions being prepared...
              </div>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="mt-6 text-center">
              <button
                onClick={handleNextQuestion}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                {isLastQuestion ? '🏁 Complete Assessment' : '➡️ Next Question'}
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}