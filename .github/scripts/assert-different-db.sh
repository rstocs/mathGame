#!/usr/bin/env bash
# Refuses to let a destructive restore point at the database it is copying from.
#
# This is the most safety-critical line in the repository. `pg_restore --clean`
# drops and recreates whatever it finds, so a restore aimed at production would
# overwrite live student progress with an older copy — the exact disaster the
# backups exist to prevent, caused by the backups.
#
# The two connection strings differ by a few characters and are both stored as
# secrets, so a wrong paste is invisible until it has already happened. Hence a
# guard, and hence tests for the guard.
#
# Usage: assert-different-db.sh <SOURCE_URL> <TARGET_URL>
set -euo pipefail

source_url=${1-}
target_url=${2-}

fail() {
  printf '%s\n' "$@" >&2
  exit 1
}

[ -n "$source_url" ] || fail "Source URL is empty; refusing to guess."
[ -n "$target_url" ] || fail "Target URL is empty; refusing to guess."

if [ "$target_url" = "$source_url" ]; then
  fail \
    "REFUSING TO RUN: the restore target is the source database." \
    "This would have overwritten live student progress."
fi

# One database can be addressed by more than one string — different pooler
# mode, port, or a rotated password all give the same project. Comparing the
# raw text alone would wave those through, so compare the project refs too.
ref_of() {
  printf '%s' "$1" | sed -n 's|.*://postgres\.\([a-z0-9]*\):.*|\1|p'
}

source_ref=$(ref_of "$source_url")
target_ref=$(ref_of "$target_url")

echo "source project: ${source_ref:-<unparsed>}"
echo "target project: ${target_ref:-<unparsed>}"

if [ -n "$source_ref" ] && [ "$source_ref" = "$target_ref" ]; then
  fail \
    "REFUSING TO RUN: both strings address project $source_ref." \
    "The target must be a separate, throwaway project."
fi

echo "Target is a different database."
