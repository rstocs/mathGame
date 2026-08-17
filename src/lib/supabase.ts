/**
 * The Supabase client, and the question of whether there is one at all.
 *
 * Cloud sync is OPTIONAL. The app has always worked as a local, single-device
 * game, and it must keep working that way: with no environment variables set,
 * with no network, and for a kid who never signs in. Sync is an addition, not a
 * replacement, so nothing here may become a thing the game cannot start without.
 *
 * That is also what makes the free plan viable — a paused or unreachable
 * project degrades to "no sync today" rather than "no maths today".
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Null when the app is built without Supabase configuration, which is the
 * normal state for local development and for anyone running this offline.
 *
 * Both values are meant to be public: they ship inside the browser bundle by
 * design. Row level security in the database is what actually protects a
 * student's data, not secrecy of this key. The database password and the
 * service_role key are the opposite, and neither belongs anywhere near here.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Needed for password recovery: the emailed link carries a token in
          // the URL that has to be picked up before a new password can be set.
          // Nothing else in the app uses a URL-borne session — there are no
          // magic links and no OAuth.
          detectSessionInUrl: true,
        },
      })
    : null;

/** Whether this build can talk to a backend at all. */
export function isCloudEnabled(): boolean {
  return supabase !== null;
}

/**
 * The client, or an explanatory throw.
 *
 * Call this only behind an `isCloudEnabled()` check or from code that already
 * requires a signed-in user. It exists so that a wiring mistake fails loudly at
 * the call site rather than surfacing later as an unexplained null.
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
        'in .env.local (see .env.example). Note the VITE_ prefix: Vite exposes only ' +
        'VITE_-prefixed variables to browser code, so the NEXT_PUBLIC_ names shown in ' +
        "Supabase's Connect dialog arrive as undefined.",
    );
  }
  return supabase;
}
