import { useEffect, useRef, useState } from 'react';
import './ConfirmDialog.css';

/**
 * A yes/no confirmation, for actions worth pausing on.
 *
 * Three small things that decide whether this actually protects anyone:
 *
 * Cancel takes focus, not the destructive button. Someone who opens this by
 * accident and hits Enter or Space out of momentum should land on the safe
 * choice, and the dangerous one should require aiming at it.
 *
 * Escape and a click outside both cancel. Every way out other than the button
 * itself means "no".
 *
 * The confirm button says what it does — "Delete account", not "OK". Read on
 * its own, halfway through a sentence, "OK" tells you nothing about what you
 * are agreeing to.
 *
 * With `passwordLabel` set it also asks for the password. That is not about
 * making the user think twice — the dialog already does that — but about WHO is
 * pressing the button. Two children share a laptop, and one of them can reach
 * an unlocked session belonging to the other. A confirmation box asks "did you
 * mean this?"; a password asks "are you the person whose work this is?", and
 * only the second question has a wrong answer a sibling cannot give.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
  passwordLabel,
  error,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  /** Receives the typed password when `passwordLabel` is set. */
  onConfirm: (password?: string) => void;
  onCancel: () => void;
  busy?: boolean;
  /** Set to require the account password before confirming. */
  passwordLabel?: string;
  /** Shown inside the dialog, so a wrong password does not close it. */
  error?: string | null;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [password, setPassword] = useState('');
  const needsPassword = passwordLabel !== undefined;

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="confirm-dialog" onClick={onCancel}>
      <div
        className="confirm-dialog__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        // The backdrop cancels; a click inside the card must not travel up to
        // it, or using the dialog at all would dismiss it.
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <div className="confirm-dialog__body">{body}</div>

        {needsPassword && (
          <div className="confirm-dialog__field">
            <label htmlFor="confirm-password">{passwordLabel}</label>
            <input
              id="confirm-password"
              className="confirm-dialog__input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                // Enter submits only once a password is present, so it cannot
                // fire the destructive action on an empty field.
                if (e.key === 'Enter' && password !== '' && !busy) onConfirm(password);
              }}
            />
          </div>
        )}

        {error && (
          <p className="confirm-dialog__error" role="alert">
            {error}
          </p>
        )}
        <div className="confirm-dialog__actions">
          <button
            ref={cancelRef}
            type="button"
            className="confirm-dialog__button"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="confirm-dialog__button confirm-dialog__button--danger"
            onClick={() => onConfirm(needsPassword ? password : undefined)}
            disabled={busy || (needsPassword && password === '')}
          >
            {busy ? 'One moment…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
