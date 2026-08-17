import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/shared/Button';
import { requestPasswordReset, signIn, signUp } from '../lib/auth';
import './SignInScreen.css';

/**
 * The way in. There is no way past it.
 *
 * Playing without an account used to be offered here, and is not any more: an
 * account is now required whenever the app is built with a backend. That makes
 * every kid's progress land somewhere it can be backed up and can follow them
 * between devices, rather than existing only in one browser's storage where a
 * cleared cache ends it.
 *
 * The cost is real and worth stating: a brand new player needs a working
 * connection once. After that Supabase keeps the session on the device, so
 * practising on a train still works — it is only the first sign-in that needs
 * the network.
 *
 * A build with no Supabase configuration at all skips this screen entirely and
 * runs as the local game it always was; there is nothing to sign in to.
 */
export function SignInScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim() !== '' && password !== '' && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const result = mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.ok) onSignedIn();
    else setError(result.error ?? 'Something went wrong.');
  }

  async function forgotPassword() {
    if (email.trim() === '') {
      setError('Type your email first, then tap this again.');
      return;
    }
    setBusy(true);
    setError(null);
    await requestPasswordReset(email);
    setBusy(false);
    // Deliberately the same message whether or not that address has an account:
    // a different one would let anyone test which emails are registered.
    setNotice('If there is an account for that email, a reset link is on its way.');
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
        {notice && (
          <p className="sign-in-screen__notice" role="status">
            {notice}
          </p>
        )}

        <Button fullWidth disabled={!canSubmit} onClick={() => void submit()}>
          {busy ? 'One moment…' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
        </Button>

        {mode === 'sign-in' && (
          <button className="sign-in-screen__switch tap-target" onClick={() => void forgotPassword()}>
            Forgot your password?
          </button>
        )}

        <button
          className="sign-in-screen__switch tap-target"
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setError(null);
            setNotice(null);
          }}
        >
          {mode === 'sign-in' ? 'No account yet? Make one' : 'Already have an account? Sign in'}
        </button>
      </div>

      <p className="sign-in-screen__skip-note">
        Your progress is saved to your account, so it is there on any device you sign in on.
      </p>
    </motion.div>
  );
}
