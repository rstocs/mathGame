#!/usr/bin/env bash
# The one true pg_dump invocation.
#
# Shared so the nightly backup and the restore verification cannot drift apart.
# If they did, the verification would keep passing while proving nothing about
# the files actually being kept — a green check over an untested backup is
# worse than no check, because it stops anyone looking.
#
# Why these flags:
#   --format=custom  compressed, and pg_restore can read it selectively
#   --no-owner       the restore target does not have Supabase's roles
#   --schema=public  the app's tables
#   --schema=auth    the accounts that own them. Without this, restored
#                    progress would belong to users who no longer exist, and
#                    every row would sit unreachable behind its own RLS policy.
#
# Usage: dump-db.sh <DB_URL> <OUTPUT_FILE>
set -euo pipefail

db_url=${1:?usage: dump-db.sh <DB_URL> <OUTPUT_FILE>}
out=${2:?usage: dump-db.sh <DB_URL> <OUTPUT_FILE>}

pg_dump "$db_url" \
  --format=custom \
  --no-owner \
  --schema=public \
  --schema=auth \
  --file="$out"

ls -lh "$out"
