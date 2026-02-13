import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { questions } from '../../data/questions';
import { Question } from '../../types/Question';
import { selectQuestions, shuffle } from '../../utils/spacedRepetition';

interface MatchPair {
  question: Question;
  isQuestionMatched: boolean;
  isAnswerMatched: boolean;
}

const MatchingGame = () => {
  const setMode = useStore((state) => state.setMode);
  const questionStats = useStore((state) => state.questionStats);
  const updateQuestionStats = useStore((state) => state.updateQuestionStats);
  const incrementCorrect = useStore((state) => state.incrementCorrect);
  const incrementIncorrect = useStore((state) => state.incrementIncorrect);
  const currentStreak = useStore((state) => state.gameStats.currentStreak);

  const [matchPairs, setMatchPairs] = useState<MatchPair[]>([]);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<number>>(new Set());

  const loadNewQuestions = () => {
    // Filter out questions that have already been used in this session
    const availableQuestions = questions.filter(q => !usedQuestionIds.has(q.id));
    
    // If we've used all questions, reset and allow all questions again
    const questionsToUse = availableQuestions.length >= 8 ? availableQuestions : questions;
    
    // If we had to reset (not enough unused questions), clear the used set
    if (availableQuestions.length < 8) {
      setUsedQuestionIds(new Set());
    }
    
    const selected = selectQuestions(questionsToUse, questionStats, 8, 'all');
    const pairs: MatchPair[] = selected.map(q => ({
      question: q,
      isQuestionMatched: false,
      isAnswerMatched: false,
    }));
    setMatchPairs(pairs);
    
    const answers = selected.map(q => q.correctAnswer);
    setShuffledAnswers(shuffle(answers));
    
    // Mark these questions as used (only if we didn't just reset)
    if (availableQuestions.length >= 8) {
      const newUsedIds = new Set(usedQuestionIds);
      selected.forEach(q => newUsedIds.add(q.id));
      setUsedQuestionIds(newUsedIds);
    } else {
      // Just reset with the new questions
      const newUsedIds = new Set<number>();
      selected.forEach(q => newUsedIds.add(q.id));
      setUsedQuestionIds(newUsedIds);
    }
  };

  useEffect(() => {
    loadNewQuestions();
  }, []);

  useEffect(() => {
    if (selectedQuestion !== null && selectedAnswer !== null) {
      checkMatch();
    }
  }, [selectedQuestion, selectedAnswer]);

  const checkMatch = () => {
    if (selectedQuestion === null || selectedAnswer === null) return;

    const questionPair = matchPairs[selectedQuestion];
    const answerText = shuffledAnswers[selectedAnswer];

    const isCorrect = questionPair.question.correctAnswer === answerText;

    if (isCorrect) {
      // Correct match
      const newPairs = [...matchPairs];
      newPairs[selectedQuestion].isQuestionMatched = true;
      newPairs[selectedQuestion].isAnswerMatched = true;
      setMatchPairs(newPairs);
      
      updateQuestionStats(questionPair.question.id, true);
      incrementCorrect();
      setScore(score + 1);
      
      setFeedbackMessage('✓ Correct Match!');
      setShowFeedback(true);

      // Mark the answer as matched
      const newAnswers = [...shuffledAnswers];
      newAnswers[selectedAnswer] = '';
      setShuffledAnswers(newAnswers);

      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackMessage('');
      }, 1000);

      // Check if all matched
      if (newPairs.every(p => p.isQuestionMatched)) {
        setTimeout(() => {
          setIsComplete(true);
        }, 1500);
      }
    } else {
      // Incorrect match - keep both visible, just show feedback
      updateQuestionStats(questionPair.question.id, false);
      incrementIncorrect();
      setMistakes(mistakes + 1);
      
      setFeedbackMessage('✗ Try Again - Keep the question and answer visible');
      setShowFeedback(true);

      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackMessage('');
      }, 1500);
    }

    setSelectedQuestion(null);
    setSelectedAnswer(null);
  };

  const handleQuestionClick = (index: number) => {
    if (matchPairs[index].isQuestionMatched) return;
    setSelectedQuestion(selectedQuestion === index ? null : index);
  };

  const handleAnswerClick = (index: number) => {
    if (shuffledAnswers[index] === '') return;
    setSelectedAnswer(selectedAnswer === index ? null : index);
  };

  const handleRestart = () => {
    loadNewQuestions();
    setSelectedQuestion(null);
    setSelectedAnswer(null);
    setScore(0);
    setMistakes(0);
    setIsComplete(false);
    setShowFeedback(false);
    setFeedbackMessage('');
  };

  if (matchPairs.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isComplete) {
    const totalAttempts = score + mistakes;
    const accuracy = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 shadow-2xl animate-bounce-in">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              All Matched! 🔗
            </h2>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-xl p-4">
                <div className="text-2xl font-bold">{score}</div>
                <div className="text-sm opacity-90">Correct</div>
              </div>
              <div className="bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-xl p-4">
                <div className="text-2xl font-bold">{mistakes}</div>
                <div className="text-sm opacity-90">Mistakes</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-4">
                <div className="text-2xl font-bold">{accuracy}%</div>
                <div className="text-sm opacity-90">Accuracy</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-lg text-gray-700">Current Streak: {currentStreak} 🔥</div>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={handleRestart} className="btn-primary">
                Play Again
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
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setMode('menu')}
            className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            ← Back
          </button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Matching Game
            </h1>
            <div className="flex gap-4 justify-center items-center text-sm text-gray-700">
              <div>
                Matched: <span className="font-bold text-green-600">{score}/8</span>
              </div>
              <div>
                Mistakes: <span className="font-bold text-red-600">{mistakes}</span>
              </div>
              <div>
                Streak: <span className="font-bold text-orange-600">{currentStreak} 🔥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`text-center mb-6 p-4 rounded-lg animate-bounce-in ${
            feedbackMessage.includes('✓') 
              ? 'bg-green-100 border-2 border-green-500 text-green-700' 
              : 'bg-red-100 border-2 border-red-500 text-red-700'
          }`}>
            <div className="text-xl font-bold">{feedbackMessage}</div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-gray-600 text-sm mb-6">
          Click a question, then click its matching answer
        </div>

        {/* Matching Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Questions Column */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Questions</h3>
            {matchPairs.map((pair, index) => (
              <button
                key={index}
                onClick={() => handleQuestionClick(index)}
                disabled={pair.isQuestionMatched}
                className={`
                  w-full p-4 rounded-lg text-left transition-all duration-300 cursor-pointer text-gray-900
                  ${pair.isQuestionMatched 
                    ? 'bg-green-100 border-2 border-green-500 opacity-50 cursor-not-allowed' 
                    : selectedQuestion === index
                    ? 'bg-blue-500 text-white border-2 border-blue-600 shadow-lg transform scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{pair.question.question}</span>
                  {pair.isQuestionMatched && <span className="text-2xl">✓</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Answers Column */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Answers</h3>
            {shuffledAnswers.map((answer, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                disabled={answer === ''}
                className={`
                  w-full p-4 rounded-lg text-left transition-all duration-300 cursor-pointer text-gray-900
                  ${answer === '' 
                    ? 'bg-green-100 border-2 border-green-500 opacity-50 cursor-not-allowed' 
                    : selectedAnswer === index
                    ? 'bg-blue-600 text-white border-2 border-blue-700 shadow-lg transform scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{answer || 'Matched ✓'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingGame;

