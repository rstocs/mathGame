import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/shared/Button';
import { signIn, signUp } from '../lib/auth';
import './SignInScreen.css';

/**
 * Signing in, with an explicit way past it.
 *
 * The "Play without an account" button is not a courtesy. This game worked
 * offline on one device before accounts existed, and a kid who cannot sign in —
 * forgotten password, no internet, a paused free-tier project — must still be
 * able to sit down and practise. An account buys one thing: progress that
 * follows them between the phone and the laptop.
 */
export function SignInScreen({ onContinue }: { onContinue: () => void }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim() !== '' && password !== '' && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const result = mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.ok) onContinue();
    else setError(result.error ?? 'Something went wrong.');
  }

  return (
    <motion.div
      className="screen sign-in-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="sign-in-screen__mascot anim-bob">🦊</div>
      <h1>Math Adventure</h1>
      <p className="sign-in-screen__subtitle">
        {mode === 'sign-in'
          ? 'Sign in so your progress follows you between devices.'
          : 'Make an account to keep your progress on every device.'}
      </p>

      <div className="sign-in-screen__form">
        <input
          className="sign-in-screen__input tap-target"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="sign-in-screen__input tap-target"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
        />

        {error && (
          <p className="sign-in-screen__error" role="alert">
            {error}
          </p>
        )}

        <Button fullWidth disabled={!canSubmit} onClick={() => void submit()}>
          {busy ? 'One moment…' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
        </Button>

        <button
          className="sign-in-screen__switch tap-target"
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setError(null);
          }}
        >
          {mode === 'sign-in' ? 'No account yet? Make one' : 'Already have an account? Sign in'}
        </button>
      </div>

      <button className="sign-in-screen__skip tap-target" onClick={onContinue}>
        Play without an account
      </button>
      <p className="sign-in-screen__skip-note">
        Your progress saves on this device, but will not follow you to another one.
      </p>
    </motion.div>
  );
}
