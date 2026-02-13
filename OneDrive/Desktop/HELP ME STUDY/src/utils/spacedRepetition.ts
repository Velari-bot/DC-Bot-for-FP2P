import { Question, QuestionStats } from '../types/Question';

/**
 * Determines difficulty based on performance
 */
export function calculateDifficulty(stats: QuestionStats): 'easy' | 'medium' | 'hard' {
  const total = stats.correctCount + stats.incorrectCount;
  
  if (total === 0) return 'medium';
  
  const accuracy = stats.correctCount / total;
  
  if (accuracy >= 0.8 && stats.correctCount >= 3) return 'easy';
  if (accuracy <= 0.4) return 'hard';
  return 'medium';
}

/**
 * Determines if a question is mastered (3+ correct with more correct than incorrect)
 */
export function isMastered(stats: QuestionStats): boolean {
  return stats.correctCount >= 3 && stats.correctCount > stats.incorrectCount;
}

/**
 * Determines if a question needs practice (more incorrect than correct)
 */
export function needsPractice(stats: QuestionStats): boolean {
  return stats.incorrectCount > stats.correctCount && stats.incorrectCount > 0;
}

/**
 * Selects questions using spaced repetition algorithm
 * - Questions answered incorrectly appear more frequently
 * - Mastered questions appear less often
 * - Takes into account last seen time
 */
export function selectQuestions(
  questions: Question[],
  statsMap: Map<number, QuestionStats>,
  count: number,
  mode: 'all' | 'weakSpot' = 'all'
): Question[] {
  const now = Date.now();
  
  let questionPool = [...questions];
  
  // For weak spot mode, only include questions that need practice
  if (mode === 'weakSpot') {
    questionPool = questionPool.filter(q => {
      const stats = statsMap.get(q.id);
      return stats && needsPractice(stats);
    });
    
    // If no weak spots, use all questions
    if (questionPool.length === 0) {
      questionPool = [...questions];
    }
  }
  
  // Calculate weight for each question
  const weighted = questionPool.map(question => {
    const stats = statsMap.get(question.id);
    
    if (!stats) {
      // Never seen questions have high priority
      return { question, weight: 100 };
    }
    
    let weight = 50; // Base weight
    
    // Increase weight for questions with more incorrect answers
    weight += stats.incorrectCount * 15;
    
    // Decrease weight for mastered questions
    if (isMastered(stats)) {
      weight -= 30;
    }
    
    // Increase weight based on time since last seen (max 7 days)
    const daysSinceLastSeen = (now - stats.lastSeen) / (1000 * 60 * 60 * 24);
    weight += Math.min(daysSinceLastSeen * 5, 35);
    
    // Adjust by difficulty
    if (stats.difficulty === 'hard') {
      weight += 20;
    } else if (stats.difficulty === 'easy') {
      weight -= 10;
    }
    
    return { question, weight: Math.max(1, weight) };
  });
  
  // Sort by weight descending
  weighted.sort((a, b) => b.weight - a.weight);
  
  // Take top questions but add some randomness
  const selected = weighted.slice(0, Math.min(count * 2, weighted.length));
  
  // Shuffle the selected pool and take the desired count
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  
  return selected.slice(0, count).map(item => item.question);
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

