#!/bin/bash

# Cloudflare Pages deployment. The ignored legacy ./functions directory contains
# dependencies from the prior host; deploy from a clean temporary cwd so Pages
# uploads the Vite output and application functions only.
set -euo pipefail

npm run build
deploy_root="$(mktemp -d /private/tmp/descowise-pages.XXXXXX)"
trap 'rm -rf "$deploy_root"' EXIT
cp -R dist "$deploy_root/dist"
# Copy only our Pages Function source, never the legacy functions/node_modules tree.
while IFS= read -r source; do
  case "$source" in
    functions/api/desco/*.ts|functions/lib/desco/*.ts)
      case "$source" in *.test.ts) continue ;; esac
      mkdir -p "$deploy_root/$(dirname "$source")"
      cp "$source" "$deploy_root/$source"
      ;;
  esac
done < <(find functions/api/desco functions/lib/desco -type f -name '*.ts' ! -name '*.test.ts')
npx wrangler --cwd "$deploy_root" pages deploy dist --project-name descowise --branch main --commit-dirty=true
