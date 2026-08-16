# Restoring the database

On the free plan these dumps are the **only** copy of every kid's progress.
Nobody else has one. So this file is not reference material — it is a procedure
to rehearse now, while the database holds nothing that matters, and again after
any change to the schema.

An untested backup is a file you hope is good.

## Where backups come from

`.github/workflows/backup.yml` runs nightly and uploads a `.dump` file as a
GitHub Actions artifact, kept 90 days. Download from the repo's **Actions** tab
→ pick a run → **Artifacts**.

For anything you want to keep longer than 90 days, download one and put it
somewhere durable. A month-end copy in cloud storage is enough at this size.

## Rehearsal: prove a restore works

Do this **before real student data exists**, and treat a failure as a blocker.

The free plan allows 2 projects, so use a second one as the practice target —
this costs nothing and never touches the real database.

1. Create a second free project, `math-adventure-restore-test`.

2. Put a marker in the real project (**SQL Editor**):

   ```sql
   create table restore_check (id int primary key, note text);
   insert into restore_check values (1, 'the restore worked');
   ```

   This exists because an empty database restores "successfully" whether or
   not data actually moves. Restoring nothing into nowhere and seeing nothing
   proves nothing. One known row turns the rehearsal into a real test.

   Confirm it landed before going on:

   ```sql
   select * from restore_check;
   ```

3. Run the backup by hand: **Actions → Nightly database backup → Run workflow**.
   Download the artifact and unzip it.

   **It must be a NEW run, started after step 2.** A backup taken earlier
   cannot contain the marker, and restoring it will show an empty result that
   looks exactly like a broken backup — sending you hunting for a fault that
   is not there.

4. Restore into the practice project. Get its connection string from the
   **Connect** button at the top of the dashboard → **Session pooler**, with
   your saved password substituted for `[YOUR-PASSWORD]`.

   Use the session pooler rather than the direct connection: direct is
   IPv6-only without the paid add-on, and the transaction pooler (port 6543)
   cannot run `pg_restore`.

   The pooler string looks like this — note the username carries the project
   reference after a dot, which the direct-connection string does not:

   ```bash
   pg_restore -d "postgresql://postgres.SCRATCHREF:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
     --clean --if-exists --no-owner \
     mathgame-YYYY-MM-DD.dump
   ```

   Some errors are normal and safe to ignore: complaints about `auth` objects
   that already exist, and about roles the practice project does not have.
   What matters is step 5.

5. In the practice project's SQL Editor, confirm the data arrived:

   ```sql
   select * from restore_check;
   select count(*) from level_progress;
   ```

   **Seeing that row is the entire point of the exercise.** If it is not there,
   stop and fix the backup before any kid uses the app.

6. Clean up the real project: `drop table restore_check;`

## Real recovery

If the live database is lost or corrupted:

1. **Stop writing to it first.** Take the app down (in Vercel, disable the
   deployment) so half-working clients cannot layer new damage on top of old.
   Every minute of writes after the problem is a minute harder to untangle.
2. Get the most recent good dump — usually last night's, but if the damage is
   older than that, pick a dump from before it.
3. Restore into a **fresh** project, not over the damaged one. The damaged
   database is evidence; you may need to read data out of it that is newer than
   the backup.
4. Point `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` at the new project and
   redeploy.
5. Only then decide what to do with the damaged project.

## What a restore cannot give back

Anything since the last nightly dump — up to 24 hours of practice. That is the
cost of the free plan, and it is a deliberate, accepted trade.

Two things reduce it if it ever starts to hurt:

- Run the backup workflow by hand before any risky migration. Takes a minute.
- Supabase Pro ($25/mo) adds their own daily backups alongside these.

`localStorage` also softens this: each device keeps its own copy, so a kid whose
device has not been cleared may still hold progress newer than the backup.
