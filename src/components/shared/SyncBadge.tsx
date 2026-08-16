import type { SyncStatus } from '../../lib/useCloudSync';
import './SyncBadge.css';

/**
 * A small, ignorable indication of whether progress has reached the cloud.
 *
 * Deliberately not a dialog and not an error banner. A failed sync means "not
 * saved to the cloud yet", not "your work is gone" — localStorage already has
 * it, and the next sync sends everything. Interrupting a kid mid-practice to
 * report a network problem they cannot fix would be worse than the problem.
 *
 * Nothing renders when there is no account or no cloud configured, so a purely
 * local game shows no chrome about a feature it is not using.
 */
export function SyncBadge({ status }: { status: SyncStatus }) {
  if (status === 'off' || status === 'signed-out' || status === 'synced') return null;

  return (
    <div className={`sync-badge sync-badge--${status}`} role="status" aria-live="polite">
      {status === 'syncing' ? 'Saving…' : 'Saved on this device'}
    </div>
  );
}
