# AI-Powered Study App 🎓

An advanced study application that helps students master their material through multiple game modes, adaptive learning, and progress tracking.

## Features 🚀

### Multiple Study Modes

1. **Multiple Choice Quiz** 📝
   - Traditional quiz format with 4 answer choices
   - Instant feedback with detailed explanations
   - Optional hints available

2. **Flashcards** 🃏
   - Interactive flip cards
   - Mark cards as "Got it" or "Need practice"
   - Review questions at your own pace

3. **Speed Mode** ⚡
   - 60-second rapid-fire challenge
   - Answer as many questions as possible
   - Build streaks for bonus points

4. **Type Your Answer** ⌨️
   - Free-form text input
   - Flexible answer matching (accepts partial answers)
   - Great for recall practice

5. **Matching Game** 🔗
   - Match questions with their correct answers
   - Visual learning approach
   - Track mistakes and progress

6. **Weak Spot Drill** 🎯
   - Automatically focuses on your struggling questions
   - Detailed explanations and hints
   - Track improvement over time

### Adaptive Learning & Spaced Repetition

- **Smart Question Selection**: Questions you struggle with appear more frequently
- **Mastery Tracking**: Questions with 3+ correct answers are marked as mastered
- **Difficulty Levels**: Automatic difficulty assignment based on performance
- **Last Seen Tracking**: Questions not seen recently are prioritized

### Progress Dashboard

Track your learning with comprehensive statistics:
- **Mastered**: Questions you've mastered (3+ correct, more correct than incorrect)
- **Studied**: Total questions you've practiced
- **Need Practice**: Questions with more incorrect than correct answers
- **Accuracy**: Overall percentage of correct answers
- **Best Streak**: Longest consecutive correct answers

### Smart Explanations

- Detailed explanations for every question
- Contextual hints that guide without revealing answers
- Vocabulary definitions within hints
- Understanding why the correct answer is right

## Getting Started 🏁

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## How to Use 📖

1. **Start at the Main Menu**: View your progress statistics and choose a study mode

2. **Select a Mode**: Each mode offers a unique way to study the material

3. **Study**: Answer questions, use hints when needed, and read explanations

4. **Track Progress**: Your statistics update in real-time and persist between sessions

5. **Focus on Weak Spots**: Use the Weak Spot Drill mode to improve on questions you struggle with

## Technology Stack 💻

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management
- **Local Storage** - Progress persistence

## Features in Detail

### Spaced Repetition Algorithm

The app uses a sophisticated algorithm to determine which questions to show:

- Questions answered incorrectly get higher priority
- Mastered questions appear less frequently
- Time since last seen is factored into selection
- Difficulty level affects question weight

### Flexible Answer Matching

For "Type Your Answer" mode:
- Accepts partial answers (70% word match)
- Case insensitive
- Punctuation ignored
- Different word orders accepted

### Progress Persistence

All your progress is automatically saved to browser local storage:
- Question statistics (correct/incorrect counts)
- Last seen timestamps
- Difficulty levels
- Overall game statistics

## Customization 🎨

### Adding Your Own Questions

Edit `src/data/questions.ts` to add or modify questions:

```typescript
{
  id: 1,
  question: "Your question here?",
  correctAnswer: "The correct answer",
  hint: "A helpful hint",
  explanation: "Detailed explanation of why this is correct",
  multipleChoiceOptions: ["Option 1", "Option 2", "Option 3", "Option 4"]
}
```

### Styling

The app uses TailwindCSS with custom gradients and animations. Modify `src/index.css` to customize the appearance.

## Tips for Effective Studying 💡

1. **Start with Multiple Choice**: Get familiar with the material
2. **Use Hints Strategically**: Try to answer first, then use hints if needed
3. **Review Explanations**: Read them even when you answer correctly
4. **Try Speed Mode**: Test your knowledge under time pressure
5. **Focus on Weak Spots**: Regularly use the Weak Spot Drill mode
6. **Mix It Up**: Use different modes to keep studying engaging

## Browser Support 🌐

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - feel free to use this for your own studying!

## Contributing

Feel free to submit issues and enhancement requests!

---

**Happy Studying! 📚✨**

