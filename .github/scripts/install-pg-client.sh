#!/usr/bin/env bash
# Installs a Postgres client matching the server's major version, and puts it
# ahead of the runner's preinstalled one on PATH.
#
# pg_dump refuses to dump a server newer than itself. Pinning a version works
# until Supabase upgrades Postgres, and then the nightly backup starts failing
# on a night nobody is watching — the worst thing here to learn about late,
# since these dumps are the only copy of every kid's progress. So ask the
# server what it is rather than assuming.
#
# Installing the package is not enough on its own: the runner already ships an
# older /usr/bin/pg_dump, and that is the one that wins until PATH says
# otherwise.
#
# psql is used for the query because only pg_dump is strict about version skew.
#
# Usage: install-pg-client.sh <DB_URL>
set -euo pipefail

db_url=${1:?usage: install-pg-client.sh <DB_URL>}

server_num=$(psql "$db_url" -tAc 'show server_version_num')
major=$((server_num / 10000))
echo "Server is Postgres $major (server_version_num=$server_num)"

sudo install -d /usr/share/keyrings
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/pgdg.gpg
echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  | sudo tee /etc/apt/sources.list.d/pgdg.list > /dev/null
sudo apt-get update -qq
sudo apt-get install -y "postgresql-client-$major"

bindir="/usr/lib/postgresql/$major/bin"
echo "$bindir" >> "$GITHUB_PATH"
export PATH="$bindir:$PATH"

client_major=$("$bindir/pg_dump" --version | grep -oE '[0-9]+' | head -1)
echo "pg_dump $client_major installed at $bindir"
if [ "$client_major" -lt "$major" ]; then
  echo "pg_dump is older than the server and will refuse to run." >&2
  exit 1
fi
