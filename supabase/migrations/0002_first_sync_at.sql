-- Tells a profile the app has actually written from one it has only been
-- handed by the sign-up trigger.
--
-- The trigger gives every new account a profiles row so the app never has to
-- treat "signed in but no profile" as a special case. The cost is that the row
-- is indistinguishable from a real one: it carries defaults — grade 7, the
-- first world, sound on — and the sync layer had no way to know they were
-- placeholders rather than choices.
--
-- That breaks the most ordinary first use there is. A kid has been playing
-- grade 9 on the laptop and signs up to keep their progress. The new row says
-- grade 7, the pull treats it as the authoritative remote preference, and their
-- first reward for making an account is being sent back two grades.
--
-- Their XP and stars were never at risk — those take the highest value — but a
-- silently reset grade is exactly the kind of "the app lost my place" that
-- makes a child stop trusting it.
--
-- So: null until the app itself has pushed. Null means "nothing real up here
-- yet, keep what the device has".
alter table public.profiles
  add column if not exists first_sync_at timestamptz;

comment on column public.profiles.first_sync_at is
  'When the app first wrote this profile. Null means the row is still the '
  'sign-up trigger''s defaults, and the device should keep its own preferences.';
