import { useEffect, useState } from 'react';
import { getSession, onAuthChange, signOut } from '../../lib/auth';
import { isCloudEnabled } from '../../lib/supabase';

/**
 * Signing out, shown only when there is something to sign out of.
 *
 * The confirmation is here because the button sits next to "Reset Progress" and
 * the two read as similar actions while doing very different things. Signing
 * out keeps everything; resetting throws it away. A kid who muddles them should
 * meet a sentence explaining which one they are about to do.
 *
 * Local progress is deliberately left in place on sign-out — see signOut().
 */
export function SignOutButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isCloudEnabled()) return;
    void getSession().then((s) => setEmail(s?.user.email ?? null));
    return onAuthChange((s) => setEmail(s?.user.email ?? null));
  }, []);

  if (!email) return null;

  if (confirming) {
    return (
      <div className="sign-out">
        <p className="sign-out__note">
          Sign out of {email}? Your progress stays saved, both here and in the cloud.
        </p>
        <button type="button" className="sign-out__button" onClick={() => void signOut()}>
          Yes, sign out
        </button>
        <button type="button" className="sign-out__button" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button type="button" className="sign-out__button" onClick={() => setConfirming(true)}>
      Sign out
    </button>
  );
}
