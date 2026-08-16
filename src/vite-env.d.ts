/// <reference types="vite/client" />

/**
 * Typed so a missing variable is a compile error rather than `undefined`
 * arriving at runtime. Both are optional: the app runs without them as a
 * local-only game, so they are `string | undefined` rather than `string`.
 *
 * The VITE_ prefix is required. Vite exposes only VITE_-prefixed variables to
 * browser code, so the NEXT_PUBLIC_ names Supabase's Connect dialog shows by
 * default would silently be undefined here.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
