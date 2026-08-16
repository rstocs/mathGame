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

## Proving a backup restores (automated)

`.github/workflows/verify-restore.yml` does this for you, in the cloud, with no
Postgres tooling on your machine. It runs monthly and on demand.

It writes a unique marker into the real database, dumps it, restores that dump
into a throwaway project, and reads the marker back out of the restored copy.
Reading that exact value out the far end is the proof; it then also checks the
four progress tables have matching row counts.

**Monthly, rather than once, on purpose.** A backup verified once is verified
once. Schemas change and Postgres versions change, and the failure mode is
silent: the nightly dump keeps going green while producing something that
cannot be restored. Nobody finds out until the day it matters.

### One-time setup

1. Create a second free Supabase project, `math-adventure-restore-test`, in the
   same region. It gets its **own** database password — save it separately.
2. Add its **session pooler** URI as the repository secret
   `SUPABASE_RESTORE_TEST_DB_URL`.
3. Run **Actions → Verify a backup restores → Run workflow**.

Everything in that project gets destroyed on every run. That is what it is for.

### The guard

The job refuses to run if the target and source are the same database, checking
both the whole string and the project ref inside it — the same project can be
addressed by more than one string, so comparing text alone is not enough.

This matters more than it looks. It is the only job here that destroys a
database on purpose, and a wrong paste into one secret would otherwise
overwrite live progress with an older copy: the exact disaster the backups
exist to prevent, caused by the backups.

---

## Doing it by hand

Prefer the automated job above. These steps are for when you need to drive a
restore yourself: recovering a specific backup, inspecting one, or restoring
somewhere the workflow does not reach.

You will restore into a throwaway second project, so the real database is
never touched.

1. Create a second free project. Dashboard → **New project**:

   - Name: `math-adventure-restore-test`
   - Region: same as the real project
   - **Database password: generate a new one and save it.** This project has
     its OWN password — the real project's password will not work here, and
     confusing the two is the most common way this step stalls.

   The free plan allows 2 projects, so this costs nothing. Keep it around: it
   is where you rehearse again after any schema change.

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

4. Restore the dump into the **practice** project, from your own machine.

   > **Check the target twice before pressing return.** `--clean` drops and
   > recreates what it finds. Aimed at the practice project it costs nothing;
   > aimed at the real one it overwrites live data with whatever the file
   > holds. The connection string in the command is the only thing deciding
   > which, and the two strings differ by a few characters.

   **4a. Confirm your local tools are new enough.** `pg_restore` refuses an
   archive written by a newer Postgres than itself — the same trap the backup
   workflow hit:

   ```bash
   pg_restore --version
   ```

   It must be 17 or higher — a client older than the server refuses the
   archive outright. If the command is not found:

   ```bash
   brew install libpq
   ```

   Homebrew keeps libpq unlinked on purpose, because it collides with the full
   PostgreSQL package, so installing it does not put `pg_restore` on your PATH.
   Either add it once:

   ```bash
   echo 'export PATH="/usr/local/opt/libpq/bin:$PATH"' >> ~/.zshrc && exec zsh
   ```

   Or skip that and call it by full path, `/usr/local/opt/libpq/bin/pg_restore`,
   wherever this file says `pg_restore`. On Apple Silicon the prefix is
   `/opt/homebrew/opt/libpq/bin` instead.

   **4b. Get the PRACTICE project's session pooler string.** Open that project
   (not the real one) and use the **Connect** button, or go straight to:

   `https://supabase.com/dashboard/project/YOUR-SCRATCH-REF?showConnect=true`

   Take the **Session pooler** URI and substitute the practice project's
   password. Direct connections are IPv6-only without the paid add-on, and the
   transaction pooler on port 6543 cannot run `pg_restore`.

   **4c. Run it**, from the folder holding the unzipped `.dump`. Note the
   username carries the project reference after a dot, which the
   direct-connection string does not:

   ```bash
   pg_restore -d "postgresql://postgres.SCRATCHREF:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
     --clean --if-exists --no-owner \
     mathgame-YYYY-MM-DD.dump
   ```

   Expect a wall of errors, and expect to ignore almost all of it. `--clean`
   tries to drop objects that do not exist yet, and the `auth` schema belongs
   to Supabase rather than to you. Harmless and normal:

   - `does not exist, skipping`
   - `role "supabase_admin" does not exist`
   - `permission denied for schema auth`
   - `must be owner of ...`

   `pg_restore` may also exit non-zero purely because of these. **The exit code
   is not the test — step 5 is.** Judge the restore only by whether the data
   arrived.

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
