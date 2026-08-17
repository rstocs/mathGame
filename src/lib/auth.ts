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
 * The raw messages are written for developers: "Invalid login credentials"
 * gives a nine-year-old nothing to do next.
 */
function friendlyMessage(raw: string): string {
  const text = raw.toLowerCase();
  if (text.includes('invalid login')) return 'That email and password do not match. Try again.';
  if (text.includes('already registered')) return 'There is already an account with that email. Try signing in instead.';
  if (text.includes('password')) return 'Passwords need to be at least 6 characters.';
  if (text.includes('email')) return 'That does not look like an email address.';
  if (text.includes('fetch') || text.includes('network')) {
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
    return error ? { ok: false, error: friendlyMessage(error.message) } : { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyMessage(String(error)) };
  }
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const { error } = await requireSupabase().auth.signUp({
      email: email.trim(),
      password,
    });
    return error ? { ok: false, error: friendlyMessage(error.message) } : { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyMessage(String(error)) };
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
    return error ? { ok: false, error: friendlyMessage(error.message) } : { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyMessage(String(error)) };
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
 */
export async function deleteAccount(): Promise<AuthResult> {
  try {
    const { error } = await requireSupabase().functions.invoke('delete-account');
    if (error) return { ok: false, error: 'Could not delete the account. Please try again.' };
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
