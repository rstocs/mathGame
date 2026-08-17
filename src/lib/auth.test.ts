import { describe, it, expect } from 'vitest';
import { friendlyAuthMessage } from './auth';

/**
 * These messages are the entire explanation a kid gets when they cannot get in.
 * A wrong one does not just fail to help — it sends them off fixing something
 * that was never broken.
 *
 * The bug that prompted this file: signing in with a perfectly good address on
 * an unconfirmed account reported "That does not look like an email address".
 * The real error was "Email not confirmed", which contains the word "email", so
 * a check meant for malformed addresses caught it first.
 */

describe('by error code', () => {
  const cases: [string, string][] = [
    ['invalid_credentials', 'That email and password do not match. Try again.'],
    ['email_not_confirmed', 'This account still needs confirming. Check your email for a confirmation link.'],
    ['user_already_exists', 'There is already an account with that email. Try signing in instead.'],
    ['weak_password', 'Passwords need to be at least 6 characters.'],
    ['over_request_rate_limit', 'Too many tries just now. Wait a minute and try again.'],
  ];

  for (const [code, expected] of cases) {
    it(`explains ${code}`, () => {
      expect(friendlyAuthMessage({ code, message: 'anything at all' })).toBe(expected);
    });
  }
});

describe('by message text, when no code arrives', () => {
  it('does not mistake an unconfirmed account for a malformed address', () => {
    // The exact regression. "Email not confirmed" contains "email"; the check
    // for a bad address must not win.
    expect(friendlyAuthMessage({ message: 'Email not confirmed' })).toContain('needs confirming');
  });

  it('still recognises a genuinely malformed address', () => {
    expect(friendlyAuthMessage({ message: 'Unable to validate email address: invalid format' }))
      .toBe('That does not look like an email address.');
  });

  it('recognises a wrong password', () => {
    expect(friendlyAuthMessage({ message: 'Invalid login credentials' }))
      .toBe('That email and password do not match. Try again.');
  });

  it('recognises a short password on sign-up', () => {
    expect(friendlyAuthMessage({ message: 'Password should be at least 6 characters' }))
      .toBe('Passwords need to be at least 6 characters.');
  });

  it('tells an offline kid they can keep playing', () => {
    expect(friendlyAuthMessage({ message: 'TypeError: Failed to fetch' }))
      .toContain('still play offline');
  });

  it('never returns a raw API message', () => {
    // Whatever arrives, a child sees a sentence written for them.
    const out = friendlyAuthMessage({ message: 'AuthApiError: unexpected_failure at /token' });
    expect(out).not.toContain('AuthApiError');
    expect(out.length).toBeGreaterThan(10);
  });

  it('copes with nothing at all', () => {
    expect(friendlyAuthMessage(null)).toBeTruthy();
    expect(friendlyAuthMessage({})).toBeTruthy();
  });
});
