#!/usr/bin/env bash
# Activate a release on the EC2 host. Runs AS ROOT on the server (via SSM
# AWS-RunShellScript). Also used for rollback: activate-release.sh <old-sha>.
#
# Usage: [RELEASE_BUCKET=<bucket>] activate-release.sh <sha> [presigned-url]
#
# Download: uses the instance role through the `aws` CLI when it is installed.
# If `aws` is missing, a pre-signed GET URL passed as the 2nd argument is used
# with curl instead. Neither the URL nor any credential is ever echoed.
#
# Flow: download+extract -> smoke test on :3001 -> atomic symlink switch ->
# restart sidedata.service -> verify :3000/healthz -> on failure restore the
# previous symlink and restart. Keeps the newest 5 releases.
set -euo pipefail

BUCKET="${RELEASE_BUCKET:-sidedata-releases-499024812515}"
REGION="${AWS_REGION:-ca-central-1}"
BASE="${SIDEDATA_BASE:-/opt/sidedata}"
RELEASES="$BASE/releases"
CURRENT="$BASE/current"
SERVICE="sidedata.service"
APP_USER="sidedata"
SMOKE_PORT=3001
LIVE_PORT=3000
KEEP=5

log() { echo "activate-release: $*"; }
die() { echo "activate-release: ERROR: $*" >&2; exit 1; }

SHA="${1:-}"
PRESIGNED_URL="${2:-}"
[[ "$SHA" =~ ^[0-9a-f]{7,40}$ ]] || die "usage: $0 <sha> [presigned-url]  (sha must be 7-40 lowercase hex)"
[[ "$(id -u)" == "0" ]] || die "must run as root"
[[ "$BUCKET" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]] || die "invalid RELEASE_BUCKET"

export HOME="${HOME:-/root}"
export AWS_DEFAULT_REGION="$REGION"
export PATH="/usr/local/bin:/usr/bin:/bin:/snap/bin:$PATH"

# One deploy at a time on this host.
exec 9>/run/sidedata-deploy.lock
flock -n 9 || die "another activation is running"

NODE_BIN="$(command -v node)" || die "node not found in PATH"
mkdir -p "$RELEASES"
TARGET="$RELEASES/$SHA"
WORK="$(mktemp -d "$RELEASES/.tmp-$SHA.XXXXXX")"
SMOKE_PID=""
SMOKE_LOG="$WORK/smoke.log"

cleanup() {
  if [[ -n "$SMOKE_PID" ]] && kill -0 "$SMOKE_PID" 2>/dev/null; then
    kill "$SMOKE_PID" 2>/dev/null || true
    wait "$SMOKE_PID" 2>/dev/null || true
  fi
  rm -rf "$WORK"
}
trap cleanup EXIT

# Poll /healthz on a port until it returns {"ok":true}. Args: port seconds
wait_healthy() {
  local port="$1" secs="$2" i body
  for ((i = 0; i < secs; i++)); do
    body="$(curl -fsS --max-time 2 "http://127.0.0.1:$port/healthz" 2>/dev/null || true)"
    if [[ "$body" == *'"ok":true'* ]]; then return 0; fi
    sleep 1
  done
  return 1
}

# --- 1. fetch + extract ----------------------------------------------------
if [[ -f "$TARGET/server.js" && -f "$TARGET/.activate-complete" ]]; then
  log "release $SHA already extracted, skipping download"
else
  TARBALL="$WORK/$SHA.tar.gz"
  if command -v aws >/dev/null 2>&1; then
    log "downloading s3://$BUCKET/releases/$SHA.tar.gz (instance role)"
    aws s3 cp --only-show-errors "s3://$BUCKET/releases/$SHA.tar.gz" "$TARBALL"
  elif [[ -n "$PRESIGNED_URL" ]]; then
    log "aws CLI not found, downloading with the pre-signed URL"
    curl -fsS --retry 3 --max-time 300 -o "$TARBALL" "$PRESIGNED_URL" \
      || die "pre-signed download failed (expired or wrong object?)"
  else
    die "aws CLI not installed and no pre-signed URL given"
  fi
  gzip -t "$TARBALL" || die "downloaded tarball is corrupt"
  mkdir -p "$WORK/extract"
  tar -xzf "$TARBALL" -C "$WORK/extract" --no-same-owner
  [[ -f "$WORK/extract/server.js" ]] || die "server.js not at tarball root"
  [[ -d "$WORK/extract/.next/static" ]] || die ".next/static missing from tarball"
  touch "$WORK/extract/.activate-complete"
  # Read-only for the service: root-owned, world-readable (the app never
  # writes into its own release directory).
  chown -R root:root "$WORK/extract"
  chmod -R u=rwX,go=rX "$WORK/extract"
  rm -rf "$TARGET"
  mv -T "$WORK/extract" "$TARGET"
  rm -f "$TARBALL"
  log "extracted to $TARGET"
fi

# --- 2. smoke test the new release on a spare port, BEFORE switching ---------
if ss -ltn "sport = :$SMOKE_PORT" | grep -q LISTEN; then
  die "smoke-test port $SMOKE_PORT is already in use"
fi
log "smoke test on 127.0.0.1:$SMOKE_PORT"
# Minimal environment on purpose: /healthz needs no secrets, and nothing from
# /etc/sidedata/env is loaded or logged here.
(
  cd "$TARGET"
  exec setpriv --reuid="$APP_USER" --regid="$APP_USER" --init-groups \
    env -i PATH="$PATH" NODE_ENV=production PORT="$SMOKE_PORT" HOSTNAME=127.0.0.1 \
    "$NODE_BIN" server.js
) >"$SMOKE_LOG" 2>&1 9>&- &
SMOKE_PID=$!
if ! wait_healthy "$SMOKE_PORT" 30; then
  echo "--- smoke test output (last 30 lines) ---" >&2
  tail -n 30 "$SMOKE_LOG" >&2 || true
  # Do not keep a release that cannot start (unless it is the live one).
  if [[ "$(readlink -f "$CURRENT" 2>/dev/null || true)" != "$(readlink -f "$TARGET")" ]]; then
    rm -rf "$TARGET"
  fi
  die "smoke test failed, live site untouched"
fi
kill "$SMOKE_PID" 2>/dev/null || true
wait "$SMOKE_PID" 2>/dev/null || true
SMOKE_PID=""
log "smoke test passed"

# --- 3. switch atomically ---------------------------------------------------
PREV=""
if [[ -L "$CURRENT" ]]; then
  PREV="$(readlink -f "$CURRENT" || true)"
elif [[ -e "$CURRENT" ]]; then
  die "$CURRENT exists and is not a symlink"
fi

switch_to() {
  ln -sfn "$1" "$BASE/current.new"
  mv -T "$BASE/current.new" "$CURRENT"
}

rollback() {
  if [[ -n "$PREV" && -d "$PREV" ]]; then
    log "restoring previous release $PREV"
    switch_to "$PREV"
    systemctl restart "$SERVICE" || true
    if wait_healthy "$LIVE_PORT" 30; then
      log "rollback complete, previous release is healthy"
    else
      echo "activate-release: CRITICAL: previous release is NOT healthy after rollback" >&2
    fi
  else
    echo "activate-release: CRITICAL: no previous release to restore" >&2
  fi
  exit 1
}

log "switching $CURRENT -> $TARGET (previous: ${PREV:-none})"
switch_to "$TARGET"
touch "$TARGET"   # mtime = last activation, used for pruning order

if ! systemctl restart "$SERVICE"; then
  echo "activate-release: restart of $SERVICE failed" >&2
  rollback
fi
if ! wait_healthy "$LIVE_PORT" 30 || ! systemctl is-active --quiet "$SERVICE"; then
  echo "activate-release: live health check failed" >&2
  journalctl -u "$SERVICE" -n 30 --no-pager 2>/dev/null | sed 's/^/  journal: /' >&2 || true
  rollback
fi
log "release $SHA is live and healthy"

# --- 4. prune ------------------------------------------------------------------
LIVE_REAL="$(readlink -f "$CURRENT")"
count=0
while IFS= read -r dir; do
  count=$((count + 1))
  [[ "$count" -le "$KEEP" ]] && continue
  real="$(readlink -f "$dir")"
  [[ "$real" == "$LIVE_REAL" || "$real" == "$PREV" ]] && continue
  log "pruning old release $(basename "$dir")"
  rm -rf "$dir"
done < <(find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended -regex '.*/[0-9a-f]{7,40}' -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)
log "done"
