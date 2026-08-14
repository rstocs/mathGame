import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { GradeSelectScreen } from './screens/GradeSelectScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import { LevelIntroScreen } from './screens/LevelIntroScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { LevelCompleteScreen } from './screens/LevelCompleteScreen';

function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'onboarding' && <OnboardingScreen key="onboarding" />}
      {currentScreen === 'grade-select' && <GradeSelectScreen key="grade-select" />}
      {currentScreen === 'world-map' && <WorldMapScreen key="world-map" />}
      {currentScreen === 'level-intro' && <LevelIntroScreen key="level-intro" />}
      {currentScreen === 'gameplay' && <GameplayScreen key="gameplay" />}
      {currentScreen === 'level-complete' && <LevelCompleteScreen key="level-complete" />}
    </AnimatePresence>
  );
}

export default App;
