import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { changePassword, deleteAccount, getSession, signOut } from '../lib/auth';
import { isCloudEnabled } from '../lib/supabase';
import './AccountScreen.css';

/**
 * Everything to do with the account, in one place a kid can find.
 *
 * The three actions here differ enormously in how much they cost if pressed by
 * mistake, and the screen is built around that rather than treating them as a
 * uniform list of settings:
 *
 *   Sign out        — costs nothing. Progress stays on the device and in the
 *                     cloud, and signing back in brings it together.
 *   Change password — costs nothing, and is the way back in that does not need
 *                     an inbox on the device being played on.
 *   Delete account  — the only irreversible action in the whole app. It is set
 *                     apart, needs the word DELETE typed out, and says plainly
 *                     what disappears.
 */
export function AccountScreen() {
  const goToWorldMap = useGameStore((s) => s.goToWorldMap);
  const playerName = useGameStore((s) => s.playerName);
  const totalXP = useGameStore((s) => s.totalXP);

  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState('');

  useEffect(() => {
    if (isCloudEnabled()) void getSession().then((s) => setEmail(s?.user.email ?? null));
  }, []);

  async function onChangePassword() {
    if (password.length < 6) {
      setMessage({ kind: 'bad', text: 'Passwords need to be at least 6 characters.' });
      return;
    }
    setBusy(true);
    const result = await changePassword(password);
    setBusy(false);
    setPassword('');
    setMessage(
      result.ok
        ? { kind: 'ok', text: 'Password changed.' }
        : { kind: 'bad', text: result.error ?? 'Could not change the password.' },
    );
  }

  async function onDelete() {
    setBusy(true);
    const result = await deleteAccount();
    setBusy(false);
    if (result.ok) goToWorldMap();
    else setMessage({ kind: 'bad', text: result.error ?? 'Could not delete the account.' });
  }

  return (
    <motion.div
      className="screen account-screen"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <div className="account-screen__bar">
        <button type="button" className="account-screen__back tap-target" onClick={goToWorldMap} aria-label="Back">
          ←
        </button>
        <h1>Account</h1>
      </div>

      {!email ? (
        // Playing without an account. Say what signing in would buy rather than
        // showing an empty settings page.
        <div className="account-card">
          <p className="account-card__lead">You are playing without an account.</p>
          <p>
            {playerName}'s progress is saved on this device only — {totalXP} XP so far. An account
            would let it follow you to a phone or another computer.
          </p>
        </div>
      ) : (
        <>
          <div className="account-card">
            <p className="account-card__label">Signed in as</p>
            <p className="account-card__email">{email}</p>
            <p className="account-card__note">
              Progress syncs automatically. Sign in with this email on another device to carry it
              across.
            </p>
          </div>

          <div className="account-card">
            <h2>Change password</h2>
            <input
              className="account-card__input tap-target"
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="account-card__button"
              disabled={busy || password === ''}
              onClick={() => void onChangePassword()}
            >
              Save new password
            </button>
          </div>

          {message && (
            <p className={`account-message account-message--${message.kind}`} role="status">
              {message.text}
            </p>
          )}

          <div className="account-card">
            <h2>Sign out</h2>
            <p className="account-card__note">
              Your progress stays saved, both here and in the cloud.
            </p>
            <button type="button" className="account-card__button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>

          <div className="account-card account-card--danger">
            <h2>Delete account</h2>
            <p className="account-card__note">
              This removes the account and all its progress — every star, badge and XP — from every
              device. It cannot be undone.
            </p>
            {!confirmDelete ? (
              <button
                type="button"
                className="account-card__button account-card__button--danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete my account
              </button>
            ) : (
              <>
                <p className="account-card__note">
                  Type <strong>DELETE</strong> to confirm.
                </p>
                <input
                  className="account-card__input tap-target"
                  value={deleteTyped}
                  onChange={(e) => setDeleteTyped(e.target.value)}
                  aria-label="Type DELETE to confirm"
                />
                <button
                  type="button"
                  className="account-card__button account-card__button--danger"
                  // Typing the word is the point. A button that only needs a
                  // second click is one mis-tap away from ending a year of work.
                  disabled={busy || deleteTyped !== 'DELETE'}
                  onClick={() => void onDelete()}
                >
                  Permanently delete
                </button>
                <button
                  type="button"
                  className="account-card__button"
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteTyped('');
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
