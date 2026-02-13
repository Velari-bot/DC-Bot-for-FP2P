import { useEffect } from 'react';
import { useStore } from './store/useStore';
import MainMenu from './components/MainMenu';
import MultipleChoice from './components/modes/MultipleChoice';
import Flashcards from './components/modes/Flashcards';
import SpeedMode from './components/modes/SpeedMode';
import TypeAnswer from './components/modes/TypeAnswer';
import MatchingGame from './components/modes/MatchingGame';
import WeakSpotDrill from './components/modes/WeakSpotDrill';

function App() {
  const currentMode = useStore((state) => state.currentMode);
  const loadStats = useStore((state) => state.loadStats);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const renderMode = () => {
    switch (currentMode) {
      case 'menu':
        return <MainMenu />;
      case 'multipleChoice':
        return <MultipleChoice />;
      case 'flashcards':
        return <Flashcards />;
      case 'speedMode':
        return <SpeedMode />;
      case 'typeAnswer':
        return <TypeAnswer />;
      case 'matching':
        return <MatchingGame />;
      case 'weakSpot':
        return <WeakSpotDrill />;
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderMode()}
    </div>
  );
}

export default App;

