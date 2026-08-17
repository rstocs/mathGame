/**
 * Deletes the calling user's account and everything attached to it.
 *
 * This exists as a server function for one reason: deleting a user requires the
 * service_role key, and that key bypasses every row level security policy in
 * the database. Putting it in the browser bundle — which is what "just call the
 * admin API from the app" would mean — hands every visitor the ability to read
 * and delete every child's progress. So the key stays here, where only Supabase
 * can see it.
 *
 * The one deletion in the project. Everywhere else, progress is archived rather
 * than removed: resetting writes zeroes, sign-out keeps the local save, and the
 * tables grant DELETE to nobody. A request to delete an account is different in
 * kind — it is a request to be forgotten, and half-honouring that is worse than
 * refusing outright. The progress rows go with the user through the
 * `on delete cascade` on each table's foreign key.
 *
 * Deploy with:
 *   supabase functions deploy delete-account
 *
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform; do
 * not add them as secrets and do not hard-code them.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Not signed in.' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Identify the caller with THEIR token, not the service key. The service
  // client can delete anybody, so it must never be the thing that decides who
  // is being deleted — that decision comes from the caller's own JWT, which
  // they cannot forge.
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Not signed in.' }, 401);

  const userId = userData.user.id;

  // Only now, with the id established from the caller's own token, use the
  // privileged client — and only on that id.
  const asAdmin = createClient(url, serviceKey);
  const { error: deleteError } = await asAdmin.auth.admin.deleteUser(userId);
  if (deleteError) return json({ error: deleteError.message }, 500);

  return json({ deleted: userId }, 200);
});
