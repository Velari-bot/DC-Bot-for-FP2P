import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { questions } from '../../data/questions';
import { Question } from '../../types/Question';
import { selectQuestions } from '../../utils/spacedRepetition';

const Flashcards = () => {
  const setMode = useStore((state) => state.setMode);
  const questionStats = useStore((state) => state.questionStats);
  const updateQuestionStats = useStore((state) => state.updateQuestionStats);
  const incrementCorrect = useStore((state) => state.incrementCorrect);
  const incrementIncorrect = useStore((state) => state.incrementIncorrect);
  const currentStreak = useStore((state) => state.gameStats.currentStreak);

  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [gotItCount, setGotItCount] = useState(0);
  const [needPracticeCount, setNeedPracticeCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [reviewedQuestionIds, setReviewedQuestionIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const unreviewedQuestions = questions.filter(q => !reviewedQuestionIds.has(q.id));
    const questionsToUse = unreviewedQuestions.length > 0 ? unreviewedQuestions : questions;
    const selected = selectQuestions(questionsToUse, questionStats, questionsToUse.length, 'all');
    setSelectedQuestions(selected);
  }, []);

  if (selectedQuestions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">Loading...</div>;
  }

  const currentQuestion = selectedQuestions[currentIndex];
  const progress = ((currentIndex + 1) / selectedQuestions.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGotIt = () => {
    updateQuestionStats(currentQuestion.id, true);
    incrementCorrect();
    setGotItCount(gotItCount + 1);
    moveToNext();
  };

  const handleNeedPractice = () => {
    updateQuestionStats(currentQuestion.id, false);
    incrementIncorrect();
    setNeedPracticeCount(needPracticeCount + 1);
    moveToNext();
  };

  const moveToNext = () => {
    // Mark this question as reviewed
    const newReviewedIds = new Set(reviewedQuestionIds);
    newReviewedIds.add(selectedQuestions[currentIndex].id);
    setReviewedQuestionIds(newReviewedIds);
    
    if (currentIndex < selectedQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    const unreviewedQuestions = questions.filter(q => !reviewedQuestionIds.has(q.id));
    const questionsToUse = unreviewedQuestions.length > 0 ? unreviewedQuestions : questions;
    
    if (unreviewedQuestions.length === 0) {
      setReviewedQuestionIds(new Set());
    }
    
    const selected = selectQuestions(questionsToUse, questionStats, questionsToUse.length, 'all');
    setSelectedQuestions(selected);
    setCurrentIndex(0);
    setIsFlipped(false);
    setGotItCount(0);
    setNeedPracticeCount(0);
    setIsComplete(false);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 shadow-2xl animate-bounce-in">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Flashcards Complete! 🃏
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-xl p-6">
                <div className="text-3xl font-bold">{gotItCount}</div>
                <div className="text-sm opacity-90">Got It</div>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-xl p-6">
                <div className="text-3xl font-bold">{needPracticeCount}</div>
                <div className="text-sm opacity-90">Need Practice</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-lg text-gray-700">Current Streak: {currentStreak} 🔥</div>
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
              Card {currentIndex + 1} of {selectedQuestions.length}
            </div>
            <div className="flex gap-4 justify-center items-center text-sm text-gray-700">
              <div>
                Got It: <span className="font-bold text-green-600">{gotItCount}</span>
              </div>
              <div>
                Need Practice: <span className="font-bold text-orange-600">{needPracticeCount}</span>
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
            className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Flashcard */}
        <div className="mb-6 animate-slide-up">
          <div
            className={`flip-card ${isFlipped ? 'flipped' : ''}`}
            onClick={handleFlip}
          >
            <div className="flip-card-inner min-h-[400px] cursor-pointer">
              {/* Front */}
              <div className="flip-card-front">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-2xl h-full flex flex-col justify-center items-center">
                  <div className="text-sm text-blue-100 mb-4">Question</div>
                  <h2 className="text-2xl font-bold text-center mb-8">
                    {currentQuestion.question}
                  </h2>
                  <div className="text-sm text-blue-100 opacity-75">
                    Click to reveal answer
                  </div>
                </div>
              </div>

              {/* Back */}
              <div className="flip-card-back">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-8 shadow-2xl h-full flex flex-col justify-center">
                  <div className="text-sm text-blue-100 mb-4">Answer</div>
                  <h2 className="text-2xl font-bold text-center mb-6">
                    {currentQuestion.correctAnswer}
                  </h2>
                  
                  <div className="bg-white/20 rounded-lg p-4 mb-4">
                    <div className="text-xs text-blue-100 mb-1">💡 Hint:</div>
                    <p className="text-sm">{currentQuestion.hint}</p>
                  </div>

                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-xs text-blue-100 mb-1">📖 Explanation:</div>
                    <p className="text-sm">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Only show when flipped */}
        {isFlipped && (
          <div className="flex gap-4 justify-center animate-slide-up">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNeedPractice();
              }}
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg cursor-pointer"
            >
              Need Practice 📚
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGotIt();
              }}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg cursor-pointer"
            >
              Got It! ✓
            </button>
          </div>
        )}

        {/* Instructions */}
        {!isFlipped && (
          <div className="text-center text-gray-600 text-sm animate-fade-in">
            <p>Click the card to flip and reveal the answer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards;
