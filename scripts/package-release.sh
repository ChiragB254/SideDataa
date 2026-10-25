#!/usr/bin/env bash
# Build the site and package a Next.js standalone release tarball for the EC2
# host (Ubuntu 24.04, arm64, Node 22).
#
# Usage: scripts/package-release.sh [git-sha]
#   Output: dist-release/<sha>.tar.gz  (+ <sha>.tar.gz.sha256)
#
# Environment:
#   SKIP_BUILD=1       reuse an existing .next build (local testing only)
#   ALLOW_DIRTY=1      allow uncommitted changes (local testing only)
#   TARGET_OS/TARGET_CPU/TARGET_LIBC  native-module target (default linux/arm64/glibc)
#   NEXT_PUBLIC_*      are inlined into the client bundle at BUILD time, so set
#                      NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_TURNSTILE_SITE_KEY here.
#
# The tarball root IS the standalone root: server.js, node_modules/, .next/,
# .next/static/ and public/ all merged in. Re-runnable: dist-release/ is recreated.
set -euo pipefail

TARGET_OS="${TARGET_OS:-linux}"
TARGET_CPU="${TARGET_CPU:-arm64}"
TARGET_LIBC="${TARGET_LIBC:-glibc}"

die() { echo "package-release: ERROR: $*" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# --- sha ---------------------------------------------------------------
SHA="${1:-}"
if [[ -z "$SHA" ]]; then
  SHA="$(git rev-parse HEAD)" || die "no sha given and not in a git checkout"
fi
[[ "$SHA" =~ ^[0-9a-f]{7,40}$ ]] || die "sha must be 7-40 lowercase hex chars, got '$SHA'"
if [[ -z "${ALLOW_DIRTY:-}" ]] && git rev-parse --git-dir >/dev/null 2>&1; then
  [[ -z "$(git status --porcelain)" ]] || die "working tree is dirty (set ALLOW_DIRTY=1 to override for local tests)"
fi

# --- tools -------------------------------------------------------------
TAR=tar
if ! tar --version 2>/dev/null | grep -q 'GNU tar'; then
  if command -v gtar >/dev/null 2>&1; then TAR=gtar; else die "GNU tar required (macOS: brew install gnu-tar)"; fi
fi
command -v node >/dev/null || die "node not found"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" == "22" ]] || echo "package-release: WARNING: Node $NODE_MAJOR here, server runs Node 22" >&2

# Reproducible timestamp: commit time when available, else a fixed epoch.
EPOCH="$(git log -1 --format=%ct 2>/dev/null || echo 1700000000)"

# --- build -------------------------------------------------------------
if [[ -z "${SKIP_BUILD:-}" ]]; then
  npm ci
  npm run build
fi
[[ -f .next/standalone/server.js ]] || die ".next/standalone/server.js missing: is output: 'standalone' set?"
[[ -d .next/static ]] || die ".next/static missing"

# --- assemble ----------------------------------------------------------
OUT="$ROOT/dist-release"
STAGE="$OUT/stage"
rm -rf "$OUT"
mkdir -p "$STAGE"
cp -R .next/standalone/. "$STAGE/"
mkdir -p "$STAGE/.next/static"
cp -R .next/static/. "$STAGE/.next/static/"
if [[ -d public ]]; then
  mkdir -p "$STAGE/public"
  cp -R public/. "$STAGE/public/"
fi

# --- native modules: make sure only the server's arch ships -------------
# Next traces sharp for the BUILD host (darwin or linux-x64), which would not
# load on the arm64 server. Drop every host variant and install the target
# variant from the lockfile (integrity-checked by npm ci).
rm -rf "$STAGE"/node_modules/@img/sharp-*
if [[ -d "$STAGE/node_modules/sharp" ]]; then
  NM_TMP="$OUT/native"
  mkdir -p "$NM_TMP"
  cp package.json package-lock.json "$NM_TMP/"
  (
    cd "$NM_TMP"
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
      --os="$TARGET_OS" --cpu="$TARGET_CPU" --libc="$TARGET_LIBC"
  )
  mkdir -p "$STAGE/node_modules/@img"
  for d in "$NM_TMP"/node_modules/@img/sharp-*; do
    [[ -d "$d" ]] || continue
    cp -R "$d" "$STAGE/node_modules/@img/"
  done
  rm -rf "$NM_TMP"
fi

# --- verify ------------------------------------------------------------
[[ -f "$STAGE/server.js" ]] || die "server.js missing from stage"
[[ -d "$STAGE/.next/static" && -d "$STAGE/.next/server" ]] || die ".next missing from stage"
if find "$STAGE" -name '.env*' -not -name '.env.example' | grep -q .; then
  die "an .env file ended up in the release; refusing to package"
fi
# Every native addon must be for the target arch. Check ELF e_machine
# (byte 18: 0xB7 = aarch64, 0x3E = x86-64) for each .node file.
want_byte="b7"; [[ "$TARGET_CPU" == "arm64" ]] || want_byte="3e"
NODE_FILES=0
while IFS= read -r -d '' f; do
  NODE_FILES=$((NODE_FILES + 1))
  magic="$(head -c 4 "$f" | od -An -tx1 | tr -d ' \n')"
  [[ "$magic" == "7f454c46" ]] || die "$f is not a Linux ELF binary"
  machine="$(dd if="$f" bs=1 skip=18 count=1 2>/dev/null | od -An -tx1 | tr -d ' \n')"
  [[ "$machine" == "$want_byte" ]] || die "$f has ELF machine 0x$machine, expected 0x$want_byte ($TARGET_CPU)"
  echo "package-release: native addon OK ($TARGET_CPU): ${f#"$STAGE"/}"
done < <(find "$STAGE" -name '*.node' -print0)
echo "package-release: $NODE_FILES native addon(s) checked"

# --- tar (deterministic) -------------------------------------------------
TARBALL="$OUT/$SHA.tar.gz"
(
  cd "$STAGE"
  find . -mindepth 1 -print0 | LC_ALL=C sort -z > "$OUT/filelist"
  "$TAR" --null --no-recursion -T "$OUT/filelist" \
    --format=gnu --numeric-owner --owner=0 --group=0 \
    --mtime="@$EPOCH" -cf - | gzip -9n > "$TARBALL"
)
rm -rf "$STAGE" "$OUT/filelist"

( cd "$OUT" && if command -v sha256sum >/dev/null; then sha256sum "$SHA.tar.gz"; else shasum -a 256 "$SHA.tar.gz"; fi > "$SHA.tar.gz.sha256" )
gzip -t "$TARBALL" || die "tarball failed integrity test"
echo "package-release: wrote $TARBALL ($(wc -c < "$TARBALL") bytes)"
