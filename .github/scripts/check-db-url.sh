#!/usr/bin/env bash
# Rejects a Supabase connection string that cannot work from CI, naming what is
# wrong with it.
#
# Shared by the backup and restore-verification workflows. Each of these
# mistakes has already cost an afternoon, and every one of them surfaces as an
# error blaming something else:
#
#   direct connection  -> "Network is unreachable" (looks like an outage)
#   transaction pooler -> a protocol error inside pg_dump
#   missing project ref-> "password authentication failed" (looks like a bad
#                         password, and sends you resetting a correct one)
#
# Usage: check-db-url.sh <LABEL> <URL>
set -euo pipefail

label=${1:?usage: check-db-url.sh <LABEL> <URL>}
url=${2-}

fail() {
  printf '%s\n' "$@" >&2
  exit 1
}

[ -n "$url" ] || fail \
  "$label is not set." \
  "Add it as a repository secret, using the Session pooler URI from the" \
  "project's Connect panel."

case "$url" in
  *@db.*.supabase.co*)
    fail \
      "$label is the DIRECT connection string, which cannot be reached from" \
      "GitHub Actions: direct connections are IPv6-only without the paid" \
      "IPv4 add-on, and the runners are IPv4." \
      "" \
      "Fix: that project's Connect panel -> Session pooler. It differs in" \
      "two places, both easy to miss:" \
      "  host: aws-N-<region>.pooler.supabase.com  (not db.<ref>.supabase.co)" \
      "  user: postgres.<ref>                      (not plain postgres)"
    ;;
  *:6543/*)
    fail \
      "$label is the TRANSACTION pooler (port 6543), which does not support" \
      "the prepared statements pg_dump and pg_restore rely on." \
      "" \
      "Fix: use the Session pooler URI - same host, port 5432."
    ;;
esac

# Through the pooler the username must carry the project ref. This is the part
# people retype by hand, so it is the part that goes wrong.
case "$url" in
  *pooler.supabase.com*)
    user=$(printf '%s' "$url" | sed -n 's|.*://\([^:]*\):.*|\1|p')
    case "$user" in
      postgres.*) ;;
      *)
        fail \
          "$label has username '${user:-<none>}', but pooler connections need" \
          "postgres.<project-ref> - the project ref after a dot." \
          "" \
          "The ref is the random string in that project's dashboard URL." \
          "Copy the whole URI from its Connect panel rather than editing" \
          "another project's string by hand."
        ;;
    esac
    ;;
esac

echo "$label looks usable."
