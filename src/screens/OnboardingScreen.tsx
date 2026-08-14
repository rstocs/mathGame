import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Button } from '../components/shared/Button';
import './OnboardingScreen.css';

export function OnboardingScreen() {
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const [name, setName] = useState('');

  return (
    <motion.div
      className="screen onboarding-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="onboarding-screen__mascot anim-bob">🦊</motion.div>
      <h1>Math Adventure</h1>
      <p className="onboarding-screen__subtitle">Grade 7 math, made into a game.</p>
      <div className="onboarding-screen__form">
        <input
          className="onboarding-screen__input tap-target"
          placeholder="What's your name?"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim() !== '') setPlayerName(name);
          }}
          autoFocus
        />
        <Button fullWidth disabled={name.trim() === ''} onClick={() => setPlayerName(name)}>
          Start Adventure
        </Button>
      </div>
    </motion.div>
  );
}
