/**
 * Flexible answer matching that accepts partial answers and different word orders
 */
export function matchAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (text: string) => 
    text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  // Check if user answer contains all significant words from correct answer
  const correctWords = normalizedCorrect.split(/\s+/).filter(word => word.length > 2);
  const userWords = normalizedUser.split(/\s+/);

  // If user answer contains at least 70% of significant words
  const matchedWords = correctWords.filter(word => 
    userWords.some(userWord => userWord.includes(word) || word.includes(userWord))
  );

  return matchedWords.length >= Math.ceil(correctWords.length * 0.7);
}

