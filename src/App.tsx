import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { SignInScreen } from './screens/SignInScreen';
import { GradeSelectScreen } from './screens/GradeSelectScreen';
import { AccountScreen } from './screens/AccountScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import { LevelIntroScreen } from './screens/LevelIntroScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { LevelCompleteScreen } from './screens/LevelCompleteScreen';
import { useCloudSync } from './lib/useCloudSync';
import { isCloudEnabled } from './lib/supabase';
import { onPasswordRecovery } from './lib/auth';
import { SyncBadge } from './components/shared/SyncBadge';

function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const { status, userId } = useCloudSync();

  // Arriving from a reset email signs them in with a recovery session, which is
  // good for exactly one thing: setting a new password. Send them to where that
  // field is, rather than dropping them on the map with no idea what happened.
  useEffect(() => onPasswordRecovery(() => useGameStore.getState().goToAccount()), []);

  // An account is required, so that every kid's progress lands somewhere it can
  // be backed up and can follow them between devices, rather than living only
  // in one browser's storage.
  //
  // Still conditional on there being a backend at all: a build with no Supabase
  // configuration is the local game this started as, and a login screen would
  // be a wall in front of nothing.
  if (isCloudEnabled() && !userId) {
    return (
      <AnimatePresence mode="wait">
        <SignInScreen key="sign-in" />
      </AnimatePresence>
    );
  }

  return (
    <>
      <SyncBadge status={status} />
      <AnimatePresence mode="wait">
        {currentScreen === 'onboarding' && <OnboardingScreen key="onboarding" />}
        {currentScreen === 'grade-select' && <GradeSelectScreen key="grade-select" />}
        {currentScreen === 'account' && <AccountScreen key="account" />}
        {currentScreen === 'world-map' && <WorldMapScreen key="world-map" />}
        {currentScreen === 'level-intro' && <LevelIntroScreen key="level-intro" />}
        {currentScreen === 'gameplay' && <GameplayScreen key="gameplay" />}
        {currentScreen === 'level-complete' && <LevelCompleteScreen key="level-complete" />}
      </AnimatePresence>
    </>
  );
}

export default App;
