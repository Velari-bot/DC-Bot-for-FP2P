import { create } from 'zustand';
import { GameMode, QuestionStats, GameStats } from '../types/Question';
import { calculateDifficulty, isMastered, needsPractice } from '../utils/spacedRepetition';
import { questions } from '../data/questions';

interface Store {
  // Current mode
  currentMode: GameMode;
  setMode: (mode: GameMode) => void;
  
  // Question statistics
  questionStats: Map<number, QuestionStats>;
  updateQuestionStats: (questionId: number, isCorrect: boolean) => void;
  
  // Game statistics
  gameStats: GameStats;
  incrementCorrect: () => void;
  incrementIncorrect: () => void;
  resetStreak: () => void;
  resetGameSession: () => void;
  
  // Computed statistics
  getMasteredCount: () => number;
  getStudiedCount: () => number;
  getNeedsPracticeCount: () => number;
  getAccuracy: () => number;
  
  // Load and save from localStorage
  loadStats: () => void;
  saveStats: () => void;
}

const STORAGE_KEY = 'ai-study-app-stats';

export const useStore = create<Store>((set, get) => ({
  currentMode: 'menu',
  questionStats: new Map(),
  gameStats: {
    currentStreak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
  },
  
  setMode: (mode) => set({ currentMode: mode }),
  
  updateQuestionStats: (questionId, isCorrect) => {
    const stats = get().questionStats;
    const currentStats = stats.get(questionId) || {
      questionId,
      correctCount: 0,
      incorrectCount: 0,
      lastSeen: 0,
      difficulty: 'medium' as const,
    };
    
    const updatedStats: QuestionStats = {
      ...currentStats,
      correctCount: isCorrect ? currentStats.correctCount + 1 : currentStats.correctCount,
      incorrectCount: !isCorrect ? currentStats.incorrectCount + 1 : currentStats.incorrectCount,
      lastSeen: Date.now(),
    };
    
    updatedStats.difficulty = calculateDifficulty(updatedStats);
    
    const newStats = new Map(stats);
    newStats.set(questionId, updatedStats);
    
    set({ questionStats: newStats });
    get().saveStats();
  },
  
  incrementCorrect: () => {
    const { gameStats } = get();
    const newStreak = gameStats.currentStreak + 1;
    set({
      gameStats: {
        ...gameStats,
        currentStreak: newStreak,
        bestStreak: Math.max(gameStats.bestStreak, newStreak),
        totalCorrect: gameStats.totalCorrect + 1,
      },
    });
    get().saveStats();
  },
  
  incrementIncorrect: () => {
    const { gameStats } = get();
    set({
      gameStats: {
        ...gameStats,
        currentStreak: 0,
        totalIncorrect: gameStats.totalIncorrect + 1,
      },
    });
    get().saveStats();
  },
  
  resetStreak: () => {
    const { gameStats } = get();
    set({
      gameStats: {
        ...gameStats,
        currentStreak: 0,
      },
    });
  },
  
  resetGameSession: () => {
    const { gameStats } = get();
    set({
      gameStats: {
        ...gameStats,
        currentStreak: 0,
      },
    });
  },
  
  getMasteredCount: () => {
    const stats = get().questionStats;
    return questions.filter(q => {
      const qStats = stats.get(q.id);
      return qStats && isMastered(qStats);
    }).length;
  },
  
  getStudiedCount: () => {
    const stats = get().questionStats;
    const studiedQuestions = questions.filter(q => {
      const qStats = stats.get(q.id);
      return qStats && (qStats.correctCount + qStats.incorrectCount) > 0;
    }).length;
    return studiedQuestions;
  },
  
  getNeedsPracticeCount: () => {
    const stats = get().questionStats;
    return questions.filter(q => {
      const qStats = stats.get(q.id);
      return qStats && needsPractice(qStats);
    }).length;
  },
  
  getAccuracy: () => {
    const { gameStats } = get();
    const total = gameStats.totalCorrect + gameStats.totalIncorrect;
    if (total === 0) return 0;
    return Math.round((gameStats.totalCorrect / total) * 100);
  },
  
  loadStats: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const statsMap = new Map<number, QuestionStats>();
        
        if (data.questionStats) {
          Object.entries(data.questionStats).forEach(([key, value]) => {
            statsMap.set(Number(key), value as QuestionStats);
          });
        }
        
        set({
          questionStats: statsMap,
          gameStats: data.gameStats || get().gameStats,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  },
  
  saveStats: () => {
    try {
      const { questionStats, gameStats } = get();
      const statsObj: { [key: number]: QuestionStats } = {};
      
      questionStats.forEach((value, key) => {
        statsObj[key] = value;
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        questionStats: statsObj,
        gameStats,
      }));
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  },
}));

