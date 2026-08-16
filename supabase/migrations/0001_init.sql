-- Math Adventure: initial schema.
--
-- Four tables rather than one JSON blob per kid. The blob would be less code
-- today and would make the parent view ("which topics is she weakest on?")
-- impossible to answer without downloading every kid's entire history and
-- picking it apart in the browser.
--
-- Every table is keyed by auth.uid() and protected by row level security, so
-- "one kid cannot read another kid's progress" is enforced by Postgres itself
-- rather than by application code being correct.
--
-- Rules this schema follows, and that later migrations must keep following:
--   * Additive only. Never rename or drop a column in the same release that
--     stops using it — a phone with the old app cached is still writing to it.
--   * Never NOT NULL without a default, for the same reason.
--   * No DELETE on progress. Deletion is the one mistake with no undo.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles: one row per kid
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  player_name   text        not null default '',
  -- Which grade's map they are on. Freely selectable, so this is a preference
  -- rather than an achievement: a 9th grader may sit on grade 7 for revision.
  selected_grade smallint   not null default 7,
  current_world_id text     not null default 'g7-ratios-proportions',
  sound_enabled bool        not null default true,
  -- How widely spaced their reviews are: 'careful' | 'standard' | 'confident'.
  -- Stored as text, not an enum: adding a fourth pace to an enum requires a
  -- migration that older clients cannot read.
  review_mode   text        not null default 'standard',
  -- Schema version of the app that last wrote this row, so a future migration
  -- can tell old shapes apart. Mirrors SCHEMA_VERSION in gameStore.ts.
  schema_version int        not null default 3,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- stats: per-kid totals
-- ---------------------------------------------------------------------------
-- Separate from profiles because these are ACHIEVEMENT values with a merge rule
-- of their own: a stale device must never be able to lower them. Keeping them
-- apart from preferences (which are last-write-wins) makes that rule easy to
-- apply and hard to get wrong by accident.
create table if not exists public.stats (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  total_xp         bigint      not null default 0,
  best_streak_ever int         not null default 0,
  unlocked_badge_ids text[]    not null default '{}',
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- level_progress: per kid, per level
-- ---------------------------------------------------------------------------
-- level_id is a content id from src/data/grades/, NOT a foreign key — the
-- content lives in the app, not the database. That is deliberate: it means
-- shipping new levels needs no migration. It also means a renamed level id
-- orphans these rows, which is exactly what the content contract test exists
-- to prevent.
create table if not exists public.level_progress (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  level_id      text        not null,
  stars         smallint    not null default 0 check (stars between 0 and 3),
  best_accuracy real        not null default 0 check (best_accuracy between 0 and 1),
  times_played  int         not null default 0,
  last_played_at timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, level_id)
);

-- ---------------------------------------------------------------------------
-- review_schedule: per kid, per question TYPE
-- ---------------------------------------------------------------------------
-- generator_id, like level_id, is a content id and not a foreign key.
--
-- This table merges the OPPOSITE way to stats. If a kid fails a topic on the
-- phone it drops to box 0, due tomorrow; a laptop still holding "box 4, due in
-- 30 days" must not win. Taking the highest value here would silently discard
-- the evidence that they just got it wrong and push the topic a month out —
-- disabling spaced repetition for exactly the kid it was built for, with
-- nothing on screen to show it. See mergeProgress.ts.
create table if not exists public.review_schedule (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  generator_id text        not null,
  box          smallint    not null default 0,
  -- A local calendar DATE, not a timestamp: practising at 9pm and again at 8am
  -- should count as two days, not eleven hours.
  due_on       date        not null,
  lapses       int         not null default 0,
  seen         int         not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, generator_id)
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Enabled BEFORE any data lands. With RLS on and no policy, the table denies
-- everything, so the risky order is enabling it late, not early.
alter table public.profiles        enable row level security;
alter table public.stats           enable row level security;
alter table public.level_progress  enable row level security;
alter table public.review_schedule enable row level security;

-- Separate policies per command rather than one `for all`, so that the absence
-- of a DELETE policy is what blocks deletion. No delete policy is written for
-- any progress table: resetting progress overwrites rows with zeroes, and the
-- database will simply refuse an accidental DELETE.
create policy profiles_select on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy stats_select on public.stats
  for select using (auth.uid() = user_id);
create policy stats_insert on public.stats
  for insert with check (auth.uid() = user_id);
create policy stats_update on public.stats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy level_progress_select on public.level_progress
  for select using (auth.uid() = user_id);
create policy level_progress_insert on public.level_progress
  for insert with check (auth.uid() = user_id);
create policy level_progress_update on public.level_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy review_schedule_select on public.review_schedule
  for select using (auth.uid() = user_id);
create policy review_schedule_insert on public.review_schedule
  for insert with check (auth.uid() = user_id);
create policy review_schedule_update on public.review_schedule
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Table privileges
-- ---------------------------------------------------------------------------
-- The project has "Automatically expose new tables" turned OFF, so a new table
-- reaches the API only if it is granted here. That is deliberate: forgetting a
-- grant breaks the feature loudly in development, whereas the setting's
-- alternative — everything exposed by default — fails silently and in the
-- wrong direction.
--
-- Two things to notice:
--
-- `anon` is granted NOTHING. Every table here is per-kid data that requires a
-- signed-in user, so a signed-out visitor should not reach these tables at all,
-- not even to be turned away by a row policy.
--
-- No DELETE is granted, to anyone. This matches the missing DELETE policies
-- above: resetting progress overwrites rows with zeroes. Deletion is the only
-- mistake with no undo, so it is blocked at two independent layers.
--
-- ANY LATER MIGRATION THAT ADDS A TABLE MUST ADD ITS GRANT HERE TOO.
grant usage on schema public to authenticated;

grant select, insert, update on public.profiles        to authenticated;
grant select, insert, update on public.stats           to authenticated;
grant select, insert, update on public.level_progress  to authenticated;
grant select, insert, update on public.review_schedule to authenticated;

-- ---------------------------------------------------------------------------
-- Give every new sign-up their rows, so the app never has to handle "signed in
-- but has no profile yet" as a special case.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.stats (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
