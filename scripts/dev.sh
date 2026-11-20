#!/bin/bash

# Serve Vite through Pages so /api/desco runs locally on the same origin.
set -euo pipefail
cd "$(dirname "$0")/.."

vite_port="${DESCO_VITE_DEV_PORT:-5173}"
pages_port="${DESCO_PAGES_DEV_PORT:-8788}"
export DESCO_PAGES_DEV_PORT="$pages_port"
dev_root="$(mktemp -d /private/tmp/descowise-dev.XXXXXX)"
mkdir -p "$dev_root/dist"
while IFS= read -r source; do
  case "$source" in
    functions/api/desco/*.ts|functions/lib/desco/*.ts)
      case "$source" in *.test.ts) continue ;; esac
      mkdir -p "$dev_root/$(dirname "$source")"
      cp "$source" "$dev_root/$source"
      ;;
  esac
done < <(find functions/api/desco functions/lib/desco -type f -name '*.ts' ! -name '*.test.ts')
if [[ ! -e .dev.vars ]]; then
  printf 'DESCO_SESSION_KEY="%s"\n' "$(openssl rand -base64 32)" > .dev.vars
  chmod 600 .dev.vars
fi
cp .dev.vars "$dev_root/.dev.vars"
chmod 600 "$dev_root/.dev.vars"

pages_pid=''
cleanup() {
  if [[ -n "$pages_pid" ]]; then
    kill "$pages_pid" 2>/dev/null || true
    wait "$pages_pid" 2>/dev/null || true
  fi
  rm -rf "$dev_root"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

npx wrangler --cwd "$dev_root" pages dev dist --ip 127.0.0.1 --port "$pages_port" --compatibility-date 2026-07-29 &
pages_pid=$!
ready=false
for _ in {1..50}; do
  if curl --silent --fail "http://127.0.0.1:$pages_port/api/desco/session" >/dev/null; then ready=true; break; fi
  if ! kill -0 "$pages_pid" 2>/dev/null; then exit 1; fi
  sleep 0.2
done
if [[ "$ready" != true ]]; then echo 'Pages Functions did not become ready' >&2; exit 1; fi

echo "Open http://127.0.0.1:$vite_port (Vite + Pages Functions)"
npm run dev:vite -- --host 127.0.0.1 --port "$vite_port" --strictPort
