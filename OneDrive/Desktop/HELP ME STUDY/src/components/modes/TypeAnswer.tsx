import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { questions } from '../../data/questions';
import { Question } from '../../types/Question';
import { selectQuestions } from '../../utils/spacedRepetition';
import { matchAnswer } from '../../utils/answerMatching';

const TypeAnswer = () => {
  const setMode = useStore((state) => state.setMode);
  const questionStats = useStore((state) => state.questionStats);
  const updateQuestionStats = useStore((state) => state.updateQuestionStats);
  const incrementCorrect = useStore((state) => state.incrementCorrect);
  const incrementIncorrect = useStore((state) => state.incrementIncorrect);
  const currentStreak = useStore((state) => state.gameStats.currentStreak);

  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([]);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<number>>(new Set());
  const [submittedQuestionId, setSubmittedQuestionId] = useState<number | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unansweredQuestions = questions.filter(q => !answeredQuestionIds.has(q.id));
    const questionsToUse = unansweredQuestions.length > 0 ? unansweredQuestions : questions;
    const selected = selectQuestions(questionsToUse, questionStats, questionsToUse.length, 'all');
    setSelectedQuestions(selected);
  }, []);

  useEffect(() => {
    if (!showResult && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, showResult]);

  if (selectedQuestions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">Loading...</div>;
  }

  const currentQuestion = selectedQuestions[currentIndex];
  const progress = ((currentIndex + 1) / selectedQuestions.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || showResult) return;

    // Store which question and answer we're evaluating to prevent race conditions
    const questionBeingAnswered = currentQuestion;
    const answerSubmitted = userAnswer.trim();
    
    setSubmittedQuestionId(questionBeingAnswered.id);
    setSubmittedAnswer(answerSubmitted);

    const correct = matchAnswer(answerSubmitted, questionBeingAnswered.correctAnswer);
    setIsCorrect(correct);
    setShowResult(true);

    updateQuestionStats(questionBeingAnswered.id, correct);

    if (correct) {
      incrementCorrect();
      setScore(score + 1);
    } else {
      incrementIncorrect();
    }
  };

  const handleOverturn = () => {
    // User disagrees with the incorrect marking - mark it as correct
    if (submittedQuestionId === null) return;
    
    // Reverse the incorrect marking
    updateQuestionStats(submittedQuestionId, true); // Mark as correct
    incrementCorrect();
    incrementIncorrect(); // Undo the previous incorrect increment by adding one more (net zero on streak)
    setScore(score + 1);
    setIsCorrect(true);
  };

  const handleNext = () => {
    // Mark this question as answered
    const newAnsweredIds = new Set(answeredQuestionIds);
    newAnsweredIds.add(submittedQuestionId || selectedQuestions[currentIndex].id);
    setAnsweredQuestionIds(newAnsweredIds);
    
    if (currentIndex < selectedQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setShowHint(false);
      setIsCorrect(false);
      setSubmittedQuestionId(null);
      setSubmittedAnswer('');
    } else {
      setIsComplete(true);
    }
  };

  const handleSkip = () => {
    setSkippedQuestions([...skippedQuestions, currentQuestion.id]);
    incrementIncorrect();
    updateQuestionStats(currentQuestion.id, false);
    
    // Mark as answered (even though skipped)
    const newAnsweredIds = new Set(answeredQuestionIds);
    newAnsweredIds.add(selectedQuestions[currentIndex].id);
    setAnsweredQuestionIds(newAnsweredIds);
    
    if (currentIndex < selectedQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setShowHint(false);
      setSubmittedQuestionId(null);
      setSubmittedAnswer('');
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    const unansweredQuestions = questions.filter(q => !answeredQuestionIds.has(q.id));
    const questionsToUse = unansweredQuestions.length > 0 ? unansweredQuestions : questions;
    
    if (unansweredQuestions.length === 0) {
      setAnsweredQuestionIds(new Set());
    }
    
    const selected = selectQuestions(questionsToUse, questionStats, questionsToUse.length, 'all');
    setSelectedQuestions(selected);
    setCurrentIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);
    setIsCorrect(false);
    setScore(0);
    setIsComplete(false);
    setSkippedQuestions([]);
  };

  if (isComplete) {
    const accuracy = Math.round((score / selectedQuestions.length) * 100);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 shadow-2xl animate-bounce-in">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Quiz Complete! ⌨️
            </h2>
            <div className="text-6xl font-bold mb-6 text-gray-900">{score}/{selectedQuestions.length}</div>
            <div className="text-2xl mb-8 text-gray-700">{accuracy}% Accuracy</div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-xl p-4">
                <div className="text-2xl font-bold">{score}</div>
                <div className="text-sm opacity-90">Correct</div>
              </div>
              <div className="bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-xl p-4">
                <div className="text-2xl font-bold">{skippedQuestions.length}</div>
                <div className="text-sm opacity-90">Skipped</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-4">
                <div className="text-2xl font-bold">{currentStreak}</div>
                <div className="text-sm opacity-90">Best Streak</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={handleRestart} className="btn-primary">
                Try Again
              </button>
              <button onClick={() => setMode('menu')} className="btn-success">
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setMode('menu')}
            className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            ← Back
          </button>
          <div className="text-center flex-1">
            <div className="text-sm text-gray-600 mb-1">
              Question {currentIndex + 1} of {selectedQuestions.length}
            </div>
            <div className="flex gap-4 justify-center items-center text-sm text-gray-700">
              <div>
                Score: <span className="font-bold text-green-600">{score}</span>
              </div>
              <div>
                Streak: <span className="font-bold text-orange-600">{currentStreak} 🔥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 shadow-xl animate-slide-up">
          <div className="text-xs text-gray-500 mb-2">Question ID: {currentQuestion.id}</div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">{currentQuestion.question}</h2>

          {/* Hint */}
          {!showResult && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="mb-4 text-sm text-blue-600 hover:text-blue-700 transition cursor-pointer font-semibold"
            >
              {showHint ? '🔓 Hide Hint' : '💡 Show Hint'}
            </button>
          )}
          {showHint && !showResult && (
            <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4 mb-6 animate-slide-up">
              <p className="text-blue-800 text-sm">{currentQuestion.hint}</p>
            </div>
          )}

          {/* Input Form */}
          {!showResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  ref={inputRef}
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  autoComplete="off"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!userAnswer.trim()}
                  className={userAnswer.trim() ? 'btn-primary flex-1' : 'btn-disabled flex-1'}
                >
                  Submit Answer
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-6 py-3 bg-gray-200 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer"
                >
                  Skip
                </button>
              </div>
            </form>
          ) : (
            <div className="animate-slide-up">
              {/* Show which question was evaluated */}
              <div className="mb-4 text-xs text-gray-500">
                Evaluated for Question ID: {submittedQuestionId} | Current Question ID: {currentQuestion.id}
              </div>
              {submittedQuestionId !== currentQuestion.id && (
                <div className="mb-4 p-3 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Warning:</strong> The question changed after you submitted! This answer was evaluated for question #{submittedQuestionId}, but you're now on question #{currentQuestion.id}.
                  </p>
                </div>
              )}
              
              {/* User's Answer */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Your Answer:</div>
                <div className={`p-4 rounded-lg border-2 ${isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{submittedAnswer}</span>
                    <span className="text-2xl">{isCorrect ? '✓' : '✗'}</span>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div
                className={`rounded-lg p-6 mb-4 border-2 ${
                  isCorrect
                    ? 'bg-green-100 border-green-500'
                    : 'bg-red-100 border-red-500'
                }`}
              >
                <h3 className="font-bold mb-2 text-lg text-gray-900">
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </h3>
                {!isCorrect && (
                  <>
                    <p className="text-sm mb-2 text-gray-800">
                      <strong>Correct Answer:</strong> {selectedQuestions.find(q => q.id === submittedQuestionId)?.correctAnswer || currentQuestion.correctAnswer}
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                      {selectedQuestions.find(q => q.id === submittedQuestionId)?.explanation || currentQuestion.explanation}
                    </p>
                    <button
                      onClick={handleOverturn}
                      className="text-sm px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition cursor-pointer font-semibold"
                    >
                      ⚖️ My Answer Was Correct (Overturn)
                    </button>
                  </>
                )}
                {isCorrect && (
                  <p className="text-sm text-gray-700">{selectedQuestions.find(q => q.id === submittedQuestionId)?.explanation || currentQuestion.explanation}</p>
                )}
              </div>

              <button onClick={handleNext} className="w-full btn-primary">
                {currentIndex < selectedQuestions.length - 1 ? 'Next Question →' : 'Finish Quiz'}
              </button>
            </div>
          )}
        </div>

        {/* Tips */}
        {!showResult && (
          <div className="mt-6 text-center text-gray-600 text-sm animate-fade-in">
            <p>💡 Tip: The answer matcher is flexible and accepts partial answers</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypeAnswer;
