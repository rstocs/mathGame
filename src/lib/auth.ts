/**
 * Accounts, kept as small as possible.
 *
 * A kid signs in once per device and stays signed in — Supabase persists the
 * session locally, so this is not something they meet every time they want to
 * practise.
 *
 * Deliberately email and password only. No magic links (a kid may not have an
 * inbox on the device they play on), no OAuth (that means a Google account),
 * and no password reset flow yet, because a parent can reset from the Supabase
 * dashboard and a half-built reset flow is worse than none.
 */

import type { Session } from '@supabase/supabase-js';
import { requireSupabase, supabase } from './supabase';

export interface AuthResult {
  ok: boolean;
  /** A message safe and useful to show a child, not the raw API error. */
  error?: string;
}

/**
 * Turns API errors into something a kid can act on.
 *
 * Keyed on the error CODE, not on the wording. Matching substrings of English
 * error text is how "Email not confirmed" came out as "that does not look like
 * an email address" — the word "email" appeared in it, so a check meant for
 * malformed addresses caught a confirmed-account problem and sent the reader
 * off to fix an address that was never wrong.
 *
 * The text fallback stays for errors that arrive without a code, but it is now
 * ordered most-specific first and tested against the phrasings that actually
 * occur.
 */
export function friendlyAuthMessage(error: { code?: string; message?: string } | null): string {
  const code = error?.code ?? '';
  const text = (error?.message ?? '').toLowerCase();

  switch (code) {
    case 'invalid_credentials':
      return 'That email and password do not match. Try again.';
    case 'email_not_confirmed':
      return 'This account still needs confirming. Check your email for a confirmation link.';
    case 'user_already_exists':
    case 'email_exists':
      return 'There is already an account with that email. Try signing in instead.';
    case 'weak_password':
      return 'Passwords need to be at least 6 characters.';
    case 'over_request_rate_limit':
      return 'Too many tries just now. Wait a minute and try again.';
    case 'over_email_send_rate_limit':
      // A different limit entirely, and far longer: Supabase's built-in mail
      // sends 2 an hour and cannot be raised without custom SMTP. Telling
      // someone to wait a minute here makes them retry into the same wall
      // repeatedly, each attempt looking like a fresh failure.
      return 'Only a couple of emails can be sent each hour, and that is used up. Try again in an hour.';
    case 'validation_failed':
      return 'Check the email and password and try again.';
  }

  // No code, so fall back to the text — most specific phrases first, since the
  // general ones are substrings of the specific ones.
  if (text.includes('not confirmed')) {
    return 'This account still needs confirming. Check your email for a confirmation link.';
  }
  if (text.includes('invalid login')) return 'That email and password do not match. Try again.';
  if (text.includes('already registered')) {
    return 'There is already an account with that email. Try signing in instead.';
  }
  if (text.includes('email rate limit') || text.includes('over_email_send')) {
    return 'Only a couple of emails can be sent each hour, and that is used up. Try again in an hour.';
  }
  if (text.includes('rate limit')) return 'Too many tries just now. Wait a minute and try again.';
  if (text.includes('password should be') || text.includes('weak password')) {
    return 'Passwords need to be at least 6 characters.';
  }
  if (text.includes('invalid email') || text.includes('unable to validate email')) {
    return 'That does not look like an email address.';
  }
  if (text.includes('fetch') || text.includes('network') || text.includes('failed to fetch')) {
    return 'Cannot reach the internet right now. You can still play offline.';
  }
  return 'Something went wrong. You can still play offline.';
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { error } = await requireSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error ? { ok: false, error: friendlyAuthMessage(error) } : { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyAuthMessage({ message: String(error) }) };
  }
}

export interface SignUpResult extends AuthResult {
  /**
   * Whether they are now signed in and can start playing.
   *
   * False when the project requires email confirmation: sign-up succeeds, but
   * it returns no session, so nothing else in the app notices anything
   * happened. Without this the screen simply sat there after a successful
   * sign-up, looking broken while working exactly as configured.
   */
  signedIn: boolean;
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  try {
    const { data, error } = await requireSupabase().auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, signedIn: false, error: friendlyAuthMessage(error) };
    return { ok: true, signedIn: data.session !== null };
  } catch (error) {
    return { ok: false, signedIn: false, error: friendlyAuthMessage({ message: String(error) }) };
  }
}

/**
 * Changes the password of the kid who is already signed in.
 *
 * Preferred over the emailed reset whenever they can still get in: no inbox, no
 * link, no waiting, and a child playing on a device with no mail account can
 * still do it themselves.
 */
export async function changePassword(newPassword: string): Promise<AuthResult> {
  try {
    const { error } = await requireSupabase().auth.updateUser({ password: newPassword });
    return error ? { ok: false, error: friendlyAuthMessage(error) } : { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyAuthMessage({ message: String(error) }) };
  }
}

/**
 * Sends a reset link, for the case where they cannot get in at all.
 *
 * Always reports success, even for an address with no account. Saying "no such
 * account" would let anyone check which emails are registered, and the honest
 * version tells the person who genuinely mistyped their address nothing useful
 * either — they still just wait for an email that never comes.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/**
 * Deletes the account and everything attached to it.
 *
 * Runs as an Edge Function rather than from the browser, and cannot be done any
 * other way: removing a user requires the service_role key, which bypasses every
 * row level security policy. Shipping that key inside the app would hand every
 * visitor the ability to read and delete every child's progress.
 *
 * The progress rows go with it, by the `on delete cascade` on each table. That
 * is the one place this project deletes rather than archives, because a request
 * to delete an account is a request to be forgotten, and half-honouring it is
 * worse than refusing.
 *
 * The password is checked by the function, not here. Checking it in the browser
 * would only be a prompt — anyone holding the session could call the function
 * directly and skip it.
 */
export async function deleteAccount(password: string): Promise<AuthResult> {
  try {
    const { data, error } = await requireSupabase().functions.invoke('delete-account', {
      body: { password },
    });
    if (error) {
      // A wrong password comes back as a 401 from the function. Say so plainly:
      // "could not delete" would send someone hunting for a fault when they
      // simply mistyped.
      const status = (error as { context?: { status?: number } }).context?.status;
      return {
        ok: false,
        error:
          status === 401
            ? 'That password is not right.'
            : 'Could not delete the account. Please try again.',
      };
    }
    if (data?.error) return { ok: false, error: String(data.error) };
    await signOut();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not delete the account. Please try again.' };
  }
}

/**
 * Fires when the kid arrives from a password-reset email.
 *
 * At that moment they are signed in with a recovery session, which is enough to
 * set a new password and nothing else.
 */
export function onPasswordRecovery(handler: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') handler();
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Signs out, leaving local progress alone.
 *
 * The localStorage save is not cleared. Signing out is not deleting an account,
 * and wiping a device's progress because someone pressed the wrong button is
 * exactly the kind of silent loss this project is built to avoid. Everything is
 * in the cloud too, and signing back in merges the two.
 */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Current session, or null when signed out or cloud is disabled. */
export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Calls back on sign-in and sign-out; returns an unsubscribe function. */
export function onAuthChange(handler: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => handler(session));
  return () => data.subscription.unsubscribe();
}
