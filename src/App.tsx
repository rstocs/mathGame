import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { SignInScreen } from './screens/SignInScreen';
import { GradeSelectScreen } from './screens/GradeSelectScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import { LevelIntroScreen } from './screens/LevelIntroScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { LevelCompleteScreen } from './screens/LevelCompleteScreen';
import { useCloudSync } from './lib/useCloudSync';
import { isCloudEnabled } from './lib/supabase';
import { SyncBadge } from './components/shared/SyncBadge';

/**
 * Whether the sign-in screen has been dealt with on this device.
 *
 * Kept out of the game store on purpose: it is a fact about this browser, not
 * about the kid's progress, and it must never travel to another device or be
 * merged with anything.
 */
const SKIP_KEY = 'math-adventure-skip-sign-in';

function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const { status, userId } = useCloudSync();
  const [skipped, setSkipped] = useState(() => localStorage.getItem(SKIP_KEY) === '1');

  // Signing in makes the earlier "play without an account" choice irrelevant,
  // so it should not linger and bypass the screen for a later sign-out.
  useEffect(() => {
    if (userId) localStorage.removeItem(SKIP_KEY);
  }, [userId]);

  // Only ever a gate when there is something to sign in to. With no Supabase
  // configuration this is a local game, exactly as it was before accounts
  // existed, and a login screen would be a wall in front of nothing.
  const needsSignIn = isCloudEnabled() && !userId && !skipped;

  if (needsSignIn) {
    return (
      <AnimatePresence mode="wait">
        <SignInScreen
          key="sign-in"
          onContinue={() => {
            localStorage.setItem(SKIP_KEY, '1');
            setSkipped(true);
          }}
        />
      </AnimatePresence>
    );
  }

  return (
    <>
      <SyncBadge status={status} />
      <AnimatePresence mode="wait">
        {currentScreen === 'onboarding' && <OnboardingScreen key="onboarding" />}
        {currentScreen === 'grade-select' && <GradeSelectScreen key="grade-select" />}
        {currentScreen === 'world-map' && <WorldMapScreen key="world-map" />}
        {currentScreen === 'level-intro' && <LevelIntroScreen key="level-intro" />}
        {currentScreen === 'gameplay' && <GameplayScreen key="gameplay" />}
        {currentScreen === 'level-complete' && <LevelCompleteScreen key="level-complete" />}
      </AnimatePresence>
    </>
  );
}

export default App;
