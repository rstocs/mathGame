import './ClaimProgressPrompt.css';

/**
 * Asked once, when someone signs in on a device holding unclaimed progress.
 *
 * This is the only case the app cannot decide for itself. If the save already
 * belongs to a known user it is merged or set aside without asking; here
 * somebody played without an account, and only a person knows whether that was
 * them.
 *
 * Both wrong guesses are bad in different ways, which is why it is a question:
 * assume "yours" and a sibling's work is absorbed into this account for good;
 * assume "not yours" and the kid who just played loses the very progress they
 * were making an account to keep.
 *
 * The wording avoids "delete" because nothing is deleted — the other save is
 * archived either way.
 */
export function ClaimProgressPrompt({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="claim-prompt" role="dialog" aria-modal="true" aria-labelledby="claim-title">
      <div className="claim-prompt__card">
        <div className="claim-prompt__mascot">🦊</div>
        <h2 id="claim-title">Is this your progress?</h2>
        <p>
          Somebody has been playing on this device without an account. If that was you, we will
          add it to yours.
        </p>
        <button type="button" className="claim-prompt__button claim-prompt__button--primary" onClick={onKeep}>
          Yes, that was me
        </button>
        <button type="button" className="claim-prompt__button" onClick={onDiscard}>
          No, that was someone else
        </button>
        <p className="claim-prompt__note">
          Either way nothing is thrown away — the other progress stays saved on this device.
        </p>
      </div>
    </div>
  );
}
