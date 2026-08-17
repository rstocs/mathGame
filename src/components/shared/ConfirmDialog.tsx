import { useEffect, useRef } from 'react';
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
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

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
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'One moment…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
