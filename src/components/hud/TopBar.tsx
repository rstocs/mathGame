import type { ReactNode } from 'react';
import { useGameStore } from '../../store/gameStore';
import { playSfx } from '../../lib/sound';
import { XPBar } from './XPBar';
import './TopBar.css';

interface TopBarProps {
  totalXP: number;
  onBack?: () => void;
  rightContent?: ReactNode;
}

export function TopBar({ totalXP, onBack, rightContent }: TopBarProps) {
  // Read straight from the store rather than taking props: TopBar is rendered
  // by three screens, and the mute control should be on all of them without
  // each one having to thread it through.
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);

  const handleToggleSound = () => {
    // Play the confirmation blip on the way *in* to sound-on, using the value
    // we are switching to, so enabling it is audible and disabling it is silent.
    toggleSound();
    playSfx('click', !soundEnabled);
  };

  return (
    <div className="top-bar">
      {onBack && (
        <button type="button" className="top-bar__back tap-target" onClick={onBack} aria-label="Back">
          ←
        </button>
      )}
      <XPBar totalXP={totalXP} />
      {rightContent && <div className="top-bar__right">{rightContent}</div>}
      <button
        type="button"
        className="top-bar__sound tap-target"
        onClick={handleToggleSound}
        aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
        aria-pressed={soundEnabled}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
    </div>
  );
}
