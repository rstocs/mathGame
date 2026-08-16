#!/usr/bin/env bash
# Tests for the two connection-string guards.
#
# These run in CI on every push, with no database and no secrets, because the
# thing being tested is pure string reasoning. That matters most for
# assert-different-db.sh: it is the only thing standing between a wrong paste
# into a secret and a restore overwriting live student progress, and it is
# otherwise the kind of code nobody exercises until the day it fails open.
set -uo pipefail

here=$(cd "$(dirname "$0")" && pwd)
check="$here/check-db-url.sh"
differ="$here/assert-different-db.sh"

pass=0
fail=0

SESSION_A="postgresql://postgres.aaaaaaaaaaaaaaaa:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
SESSION_B="postgresql://postgres.bbbbbbbbbbbbbbbb:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# expect <accept|reject> <description> <command...>
expect() {
  local want=$1 desc=$2; shift 2
  local out rc
  out=$("$@" 2>&1); rc=$?
  if { [ "$want" = accept ] && [ $rc -eq 0 ]; } || { [ "$want" = reject ] && [ $rc -ne 0 ]; }; then
    pass=$((pass + 1))
    printf '  ok      %s\n' "$desc"
  else
    fail=$((fail + 1))
    printf '  FAILED  %s (wanted %s, exit %d)\n%s\n' "$desc" "$want" "$rc" "$out"
  fi
}

echo "check-db-url.sh"
expect accept "session pooler URI" \
  "$check" LABEL "$SESSION_A"
expect reject "direct connection (IPv6-only, unreachable from CI)" \
  "$check" LABEL "postgresql://postgres:pw@db.aaaaaaaaaaaaaaaa.supabase.co:5432/postgres"
expect reject "transaction pooler (no prepared statements)" \
  "$check" LABEL "postgresql://postgres.aaaaaaaaaaaaaaaa:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
expect reject "pooler username missing the project ref" \
  "$check" LABEL "postgresql://postgres:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
expect reject "empty URL" \
  "$check" LABEL ""

echo "assert-different-db.sh"
expect accept "two genuinely different projects" \
  "$differ" "$SESSION_A" "$SESSION_B"
expect reject "identical strings" \
  "$differ" "$SESSION_A" "$SESSION_A"
# The dangerous near-miss: same database, different-looking string. A plain
# text comparison would wave this through and destroy the source.
expect reject "same project, different password" \
  "$differ" "$SESSION_A" "postgresql://postgres.aaaaaaaaaaaaaaaa:OTHERPW@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
expect reject "same project, different pooler port" \
  "$differ" "$SESSION_A" "postgresql://postgres.aaaaaaaaaaaaaaaa:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
expect reject "empty target" \
  "$differ" "$SESSION_A" ""
expect reject "empty source" \
  "$differ" "" "$SESSION_B"

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
