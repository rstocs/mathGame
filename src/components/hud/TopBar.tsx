import type { ReactNode } from 'react';
import { XPBar } from './XPBar';
import './TopBar.css';

interface TopBarProps {
  totalXP: number;
  onBack?: () => void;
  rightContent?: ReactNode;
}

export function TopBar({ totalXP, onBack, rightContent }: TopBarProps) {
  return (
    <div className="top-bar">
      {onBack && (
        <button type="button" className="top-bar__back tap-target" onClick={onBack} aria-label="Back">
          ←
        </button>
      )}
      <XPBar totalXP={totalXP} />
      {rightContent && <div className="top-bar__right">{rightContent}</div>}
    </div>
  );
}
